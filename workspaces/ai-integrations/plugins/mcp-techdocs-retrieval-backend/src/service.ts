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
import { LoggerService, DiscoveryService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { CatalogClient } from '@backstage/catalog-client';
import { Publisher } from '@backstage/plugin-techdocs-node';

export interface TechDocsEntity {
  kind: string;
  namespace: string;
  name: string;
  title?: string;
}

export interface TechDocsEntityWithUrls extends TechDocsEntity {
  techDocsUrl: string;
  metadataUrl: string;
}

export interface TechDocsCoverageResult {
  total: number;
  withDocs: number;
  withoutDocs: number;
  coveragePercentage: number;
  entitiesWithoutDocs: TechDocsEntity[];
}

export interface ListTechDocsOptions {
  entityType?: string;
  namespace?: string;
  limit?: number;
}

export class TechDocsService {
  private catalog: CatalogClient;
  private publisher?: Publisher;

  constructor(
    private config: Config,
    private logger: LoggerService,
    private discovery: DiscoveryService,
  ) {
    this.catalog = new CatalogClient({ discoveryApi: discovery });
  }

  async initialize() {
    this.publisher = await Publisher.fromConfig(this.config, {
      logger: this.logger,
      discovery: this.discovery,
    });
  }

  async getPublisher(): Promise<Publisher> {
    if (!this.publisher) {
      await this.initialize();
    }
    return this.publisher!;
  }

  /**
   * List all entities that have TechDocs available
   */
  async listTechDocs(
    options: ListTechDocsOptions = {},
  ): Promise<{ count: number; items: TechDocsEntity[] }> {
    const { entityType, namespace, limit = 500 } = options;

    this.logger.info('Fetching entities from catalog...');

    // Build filters for catalog query
    const filters: Record<string, string | string[]> = {};
    if (entityType) {
      filters.kind = entityType;
    }
    if (namespace) {
      filters['metadata.namespace'] = namespace;
    }

    const resp = await this.catalog.getEntities({
      fields: ['kind', 'metadata.namespace', 'metadata.name', 'metadata.title'],
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      limit,
    });

    this.logger.info(
      `Found ${resp.items.length} entities, checking TechDocs availability...`,
    );

    const publisher = await this.getPublisher();

    // Check which entities have TechDocs available
    const checks = await Promise.allSettled(
      resp.items.map(async entity => {
        const ns = entity.metadata.namespace ?? 'default';
        const kind = entity.kind;
        const name = entity.metadata.name;

        // Try to fetch TechDocs metadata to verify availability
        // Use the correct parameter format for fetchTechDocsMetadata
        await publisher.fetchTechDocsMetadata({
          namespace: ns,
          kind: kind,
          name: name,
        });

        return {
          kind: entity.kind,
          namespace: entity.metadata.namespace ?? 'default',
          name: entity.metadata.name,
          title: entity.metadata.title,
        };
      }),
    );

    const items = checks
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<TechDocsEntity>).value);

    this.logger.info(
      `Successfully found ${items.length} entities with TechDocs`,
    );

    return { count: items.length, items };
  }

  /**
   * List entities with TechDocs including URLs for API responses
   */
  async listTechDocsWithUrls(
    options: ListTechDocsOptions = {},
  ): Promise<{ count: number; items: TechDocsEntityWithUrls[] }> {
    const result = await this.listTechDocs(options);
    const backendUrl = await this.discovery.getBaseUrl('techdocs-retrieval');

    const itemsWithUrls = result.items.map(item => ({
      ...item,
      techDocsUrl: `${backendUrl}/techdocs/${item.namespace.toLowerCase()}/${item.kind.toLowerCase()}/${item.name.toLowerCase()}`,
      metadataUrl: `${backendUrl}/techdocs/${item.namespace.toLowerCase()}/${item.kind.toLowerCase()}/${item.name.toLowerCase()}/metadata`,
    }));

    return {
      count: itemsWithUrls.length,
      items: itemsWithUrls,
    };
  }

  /**
   * Get TechDocs metadata for a specific entity
   */
  async getTechDocsMetadata(entityRef: string) {
    // Parse entity reference
    let kind: string;
    let namespace: string;
    let name: string;

    if (entityRef.includes(':')) {
      const [kindPart, rest] = entityRef.split(':', 2);
      kind = kindPart;

      if (rest.includes('/')) {
        const [namespacePart, namePart] = rest.split('/', 2);
        namespace = namespacePart;
        name = namePart;
      } else {
        namespace = 'default';
        name = rest;
      }
    } else {
      throw new Error(
        'Invalid entity reference format. Expected "kind:namespace/name" or "kind:name"',
      );
    }

    this.logger.info(
      `Fetching TechDocs metadata for ${kind}:${namespace}/${name}`,
    );

    const publisher = await this.getPublisher();

    // Fetch metadata using the correct parameter format
    const metadata = await publisher.fetchTechDocsMetadata({
      namespace,
      kind,
      name,
    });

    return {
      metadata,
      entity: { kind, namespace, name },
    };
  }

  /**
   * Get TechDocs metadata with URLs for API responses
   */
  async getTechDocsMetadataWithUrl(entityRef: string) {
    const result = await this.getTechDocsMetadata(entityRef);
    const backendUrl = await this.discovery.getBaseUrl('techdocs-retrieval');
    const { kind, namespace, name } = result.entity;

    const techDocsUrl = `${backendUrl}/techdocs/${namespace.toLowerCase()}/${kind.toLowerCase()}/${name.toLowerCase()}`;

    return {
      ...result,
      techDocsUrl,
    };
  }

  /**
   * Analyze documentation coverage across entities
   */
  async checkTechDocsCoverage(
    options: { entityType?: string; namespace?: string } = {},
  ): Promise<TechDocsCoverageResult> {
    const { entityType, namespace } = options;

    this.logger.info('Analyzing TechDocs coverage...');

    // Build filters for catalog query
    const filters: Record<string, string | string[]> = {};
    if (entityType) {
      filters.kind = entityType;
    }
    if (namespace) {
      filters['metadata.namespace'] = namespace;
    }

    const resp = await this.catalog.getEntities({
      fields: ['kind', 'metadata.namespace', 'metadata.name', 'metadata.title'],
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      limit: 1000, // Higher limit for coverage analysis
    });

    this.logger.info(
      `Analyzing ${resp.items.length} entities for TechDocs coverage...`,
    );

    const publisher = await this.getPublisher();

    // Check which entities have TechDocs available
    const checks = await Promise.allSettled(
      resp.items.map(async entity => {
        const ns = entity.metadata.namespace ?? 'default';
        const kind = entity.kind;
        const name = entity.metadata.name;

        try {
          await publisher.fetchTechDocsMetadata({
            namespace: ns,
            kind: name,
          });
          return { entity, hasDocs: true };
        } catch {
          return { entity, hasDocs: false };
        }
      }),
    );

    const results = checks
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const withDocs = results.filter(r => r.hasDocs).length;
    const withoutDocs = results.filter(r => !r.hasDocs).length;
    const total = results.length;
    const coveragePercentage =
      total > 0 ? Math.round((withDocs / total) * 100) : 0;

    const entitiesWithoutDocs = results
      .filter(r => !r.hasDocs)
      .map(r => ({
        kind: r.entity.kind,
        namespace: r.entity.metadata.namespace ?? 'default',
        name: r.entity.metadata.name,
        title: r.entity.metadata.title,
      }));

    this.logger.info(
      `TechDocs coverage analysis complete: ${withDocs}/${total} (${coveragePercentage}%)`,
    );

    return {
      total,
      withDocs,
      withoutDocs,
      coveragePercentage,
      entitiesWithoutDocs,
    };
  }
}
