/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type {
  LoggerService,
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import type { Config } from '@backstage/config';
import { InputError, isError } from '@backstage/errors';

import {
  fetchOAuthToken,
  fetchKagentiNamespaces,
  fetchKagentiAgents,
  fetchKagentiAgentDetail,
  fetchKagentiAgentCard,
  fetchKagentiRouteStatus,
  fetchKagentiDashboards,
} from '../clients/KagentiApiConnector';
import { generateEntities } from '../clients/KagentiEntityGenerator';
import type { KagentiConfig } from './types';
import { readKagentiEntityConfigs } from './config';

/**
 * Provides entities from the Kagenti API, allowing agents to be imported into RHDH
 *
 * @public
 */
export class KagentiAgentEntityProvider implements EntityProvider {
  private readonly env: string;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenUrl: string;
  private readonly namespaces?: string[];
  private readonly lifecycleMapping?: Record<string, string>;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;

  static fromConfig(
    deps: {
      config: Config;
      logger: LoggerService;
    },
    options:
      | { schedule: SchedulerServiceTaskRunner }
      | { scheduler: SchedulerService },
  ): KagentiAgentEntityProvider[] {
    const { config, logger } = deps;

    const providerConfigs = readKagentiEntityConfigs(config);

    return providerConfigs.map(providerConfig => {
      let taskRunner;
      if ('scheduler' in options && providerConfig.schedule) {
        taskRunner = options.scheduler.createScheduledTaskRunner(
          providerConfig.schedule,
        );
      } else if ('schedule' in options) {
        taskRunner = options.schedule;
      } else {
        throw new InputError(
          `No schedule provided via config for KagentiAgentEntityProvider:${providerConfig.id}.`,
        );
      }

      return new KagentiAgentEntityProvider(providerConfig, logger, taskRunner);
    });
  }

  private constructor(
    config: KagentiConfig,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
  ) {
    this.env = config.id;
    this.baseUrl = config.baseUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tokenUrl = config.tokenUrl;
    this.namespaces = config.namespaces;
    this.lifecycleMapping = config.lifecycleMapping;
    this.logger = logger.child({ target: this.getProviderName() });
    this.scheduleFn = this.createScheduleFn(taskRunner);
  }

  createScheduleFn(
    taskRunner: SchedulerServiceTaskRunner,
  ): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderName()}:run`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          try {
            await this.run();
          } catch (error) {
            if (isError(error)) {
              this.logger.error(
                `Error while syncing resources from Kagenti ${this.baseUrl}`,
                {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                  status: (error.response as { status?: string })?.status,
                },
              );
            }
          }
        },
      });
    };
  }

  getProviderName(): string {
    return `KagentiAgentEntityProvider:${this.env}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    this.logger.info(`Discovering Kagenti agent entities from ${this.baseUrl}`);

    const token = await fetchOAuthToken(
      this.tokenUrl,
      this.clientId,
      this.clientSecret,
    );

    const allNamespaces = await fetchKagentiNamespaces(this.baseUrl, token);
    const filteredNamespaces = this.namespaces
      ? allNamespaces.filter(ns => this.namespaces!.includes(ns.name))
      : allNamespaces;

    const agents = await fetchKagentiAgents(
      this.baseUrl,
      token,
      filteredNamespaces.map(ns => ns.name),
    );

    const detailedAgents = await Promise.all(
      agents.map(async agent => {
        const detail = await fetchKagentiAgentDetail(
          this.baseUrl,
          token,
          agent.namespace,
          agent.name,
        );
        const routeStatus = await fetchKagentiRouteStatus(
          this.baseUrl,
          token,
          agent.namespace,
          agent.name,
        );
        return {
          ...detail,
          url: routeStatus.hasRoute ? routeStatus.url : undefined,
        };
      }),
    );

    const agentCards = new Map<
      string,
      Awaited<ReturnType<typeof fetchKagentiAgentCard>>
    >();
    await Promise.all(
      detailedAgents
        .filter(agent => {
          const labels = agent.labels ?? {};
          return Object.keys(labels).some(k =>
            k.startsWith('protocol.kagenti.io/a2a'),
          );
        })
        .map(async agent => {
          try {
            const card = await fetchKagentiAgentCard(
              this.baseUrl,
              token,
              agent.namespace,
              agent.name,
            );
            agentCards.set(`${agent.namespace}/${agent.name}`, card);
          } catch (err) {
            this.logger.warn(
              `Failed to fetch agent card for ${agent.namespace}/${
                agent.name
              }: ${isError(err) ? err.message : err}`,
            );
          }
        }),
    );

    const dashboards = await fetchKagentiDashboards(this.baseUrl, token);

    const entityList = generateEntities(
      detailedAgents,
      agentCards,
      filteredNamespaces,
      dashboards,
      this.lifecycleMapping,
    );

    const providerName = this.getProviderName();
    entityList.forEach(entity => {
      if (entity.metadata.annotations === undefined) {
        entity.metadata.annotations = {
          [ANNOTATION_LOCATION]: providerName,
          [ANNOTATION_ORIGIN_LOCATION]: providerName,
        };
      } else {
        entity.metadata.annotations[ANNOTATION_LOCATION] = providerName;
        entity.metadata.annotations[ANNOTATION_ORIGIN_LOCATION] = providerName;
      }
    });

    this.logger.debug(`Found ${entityList.length} Kagenti entities`);

    await this.connection.applyMutation({
      type: 'full',
      entities: entityList.map(entity => ({
        entity,
        locationKey: providerName,
      })),
    });
  }
}
