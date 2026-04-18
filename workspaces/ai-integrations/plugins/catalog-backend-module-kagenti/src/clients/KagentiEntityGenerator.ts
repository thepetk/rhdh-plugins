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
  Entity,
  ComponentEntity,
  ApiEntity,
  SystemEntity,
} from '@backstage/catalog-model';

import type {
  KagentiAgent,
  KagentiAgentCard,
  KagentiDashboards,
  KagentiNamespace,
} from './types';

function extractProtocolLabel(labels?: Record<string, string>): string {
  if (!labels) return '';
  const protocolKey = Object.keys(labels).find(k =>
    k.startsWith('protocol.kagenti.io/'),
  );
  return protocolKey ? protocolKey.replace('protocol.kagenti.io/', '') : '';
}

function deriveLifecycle(
  namespace: string,
  lifecycleMapping?: Record<string, string>,
): string {
  return lifecycleMapping?.[namespace] ?? 'production';
}

function deriveDefinitionFromSkills(
  skills: KagentiAgentCard['skills'],
): string {
  const lines = ['skills:'];
  for (const skill of skills) {
    lines.push(`  - id: ${skill.id}`);
    lines.push(`    name: ${skill.name}`);
    lines.push(`    description: ${skill.description}`);
    if (skill.examples.length > 0) {
      lines.push(`    examples:`);
      skill.examples.forEach(ex => lines.push(`      - ${ex}`));
    }
  }
  return lines.join('\n');
}

function buildComponentEntity(
  agent: KagentiAgent,
  dashboards: KagentiDashboards,
  lifecycleMapping?: Record<string, string>,
): ComponentEntity {
  const protocol = extractProtocolLabel(agent.labels);
  const framework = agent.labels?.['kagenti.io/framework'] ?? '';
  const workloadType = agent.labels?.['kagenti.io/workload-type'] ?? '';
  const description = agent.annotations?.['kagenti.io/description'];

  const links: ComponentEntity['metadata']['links'] = [];
  if (dashboards.traces_dashboard_url) {
    links.push({
      title: 'Traces (Phoenix)',
      url: dashboards.traces_dashboard_url,
    });
  }
  if (dashboards.network_dashboard_url) {
    links.push({
      title: 'Network (Kiali)',
      url: dashboards.network_dashboard_url,
    });
  }
  if (dashboards.mlflow_dashboard_url) {
    links.push({
      title: 'Experiments (MLflow)',
      url: dashboards.mlflow_dashboard_url,
    });
  }

  const annotations: Record<string, string> = {
    'kagenti.io/framework': framework,
    'kagenti.io/workload-type': workloadType,
    'kagenti.io/created-at': agent.createdAt ?? '',
  };
  if (agent.url) {
    annotations['backstage.io/source-location'] = agent.url;
  }

  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: agent.name,
      namespace: agent.namespace,
      ...(description && { description }),
      annotations,
      labels: {
        ...(protocol && { protocol }),
        ...(framework && { framework: framework.toLowerCase() }),
      },
      links,
    },
    spec: {
      type: 'service',
      lifecycle: deriveLifecycle(agent.namespace, lifecycleMapping),
      owner: agent.namespace,
      system: 'kagenti',
    },
  };
}

function buildApiEntity(
  agent: KagentiAgent,
  agentCard: KagentiAgentCard,
  lifecycleMapping?: Record<string, string>,
): ApiEntity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'API',
    metadata: {
      name: agentCard.name,
      namespace: agent.namespace,
      ...(agentCard.description && { description: agentCard.description }),
      annotations: {
        'kagenti.io/version': agentCard.version,
        'kagenti.io/streaming': String(agentCard.streaming),
      },
    },
    spec: {
      type: agentCard.streaming ? 'asyncapi' : 'openapi',
      lifecycle: deriveLifecycle(agent.namespace, lifecycleMapping),
      owner: agent.namespace,
      system: 'kagenti',
      definition: deriveDefinitionFromSkills(agentCard.skills),
    },
  };
}

function buildSystemEntity(namespace: KagentiNamespace): SystemEntity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'System',
    metadata: {
      name: `kagenti-${namespace.name}`,
      description: `Kagenti agent namespace: ${namespace.name}`,
    },
    spec: {
      owner: namespace.name,
      domain: 'kagenti',
    },
  };
}

/**
 * generateEntities transforms Kagenti API data into Backstage catalog entities.
 * Returns Component (one per agent), API (one per A2A agent), and System (one per namespace).
 *
 * @public
 */
export function generateEntities(
  agents: KagentiAgent[],
  agentCards: Map<string, KagentiAgentCard>,
  namespaces: KagentiNamespace[],
  dashboards: KagentiDashboards,
  lifecycleMapping?: Record<string, string>,
): Entity[] {
  const entities: Entity[] = [];

  for (const ns of namespaces) {
    entities.push(buildSystemEntity(ns));
  }

  for (const agent of agents) {
    entities.push(buildComponentEntity(agent, dashboards, lifecycleMapping));

    const card = agentCards.get(`${agent.namespace}/${agent.name}`);
    if (card) {
      entities.push(buildApiEntity(agent, card, lifecycleMapping));
    }
  }

  return entities;
}
