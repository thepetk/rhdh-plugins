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
import {
  ActionsRegistryService,
  LoggerService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { TechDocsService } from './service';

interface TechDocsActionsOptions {
  actionsRegistry: ActionsRegistryService;
  logger: LoggerService;
  config: Config;
  discovery: DiscoveryService;
}

export async function registerTechDocsActions(options: TechDocsActionsOptions) {
  const { actionsRegistry, logger, config, discovery } = options;

  // Initialize shared service
  const techDocsService = new TechDocsService(config, logger, discovery);

  // Action: List all entities with TechDocs
  actionsRegistry.register({
    name: 'list-techdocs',
    title: 'List TechDocs',
    description:
      'List all entities that have TechDocs available, with direct links to documentation',
    schema: {
      input: z =>
        z.object({
          entityType: z
            .string()
            .optional()
            .describe('Filter by entity type (e.g., Component, API, System)'),
          namespace: z.string().optional().describe('Filter by namespace'),
          limit: z
            .number()
            .min(1)
            .max(1000)
            .default(500)
            .describe('Maximum number of entities to return'),
        }),
      output: z =>
        z.object({
          count: z.number().describe('Number of entities with TechDocs found'),
          items: z
            .array(
              z.object({
                kind: z.string().describe('Entity kind (e.g., Component)'),
                namespace: z.string().describe('Entity namespace'),
                name: z.string().describe('Entity name'),
                title: z.string().optional().describe('Entity title'),
                techDocsUrl: z.string().describe('Direct URL to TechDocs site'),
                metadataUrl: z
                  .string()
                  .describe('URL to TechDocs metadata API'),
              }),
            )
            .describe('List of entities with TechDocs'),
        }),
    },
    attributes: {
      readOnly: true,
      idempotent: true,
    },
    action: async ({ input }) => {
      // Removed logger and discovery from destructuring
      try {
        const result = await techDocsService.listTechDocsWithUrls({
          entityType: input.entityType,
          namespace: input.namespace,
          limit: input.limit,
        });

        return { output: result };
      } catch (error) {
        logger.error('Error listing TechDocs:', error); // Use outer scope logger
        throw new Error(`Failed to list TechDocs: ${error}`);
      }
    },
  });

  // Action: Get TechDocs metadata for a specific entity
  actionsRegistry.register({
    name: 'get-techdocs-metadata',
    title: 'Get TechDocs Metadata',
    description:
      'Get metadata for TechDocs of a specific entity, including build info and structure',
    schema: {
      input: z =>
        z.object({
          entityRef: z
            .string()
            .describe(
              'Entity reference in format "kind:namespace/name" or "kind:name"',
            ),
        }),
      output: z =>
        z.object({
          metadata: z.record(z.any()).describe('TechDocs metadata object'),
          entity: z
            .object({
              kind: z.string(),
              namespace: z.string(),
              name: z.string(),
            })
            .describe('Parsed entity reference'),
          techDocsUrl: z.string().describe('Direct URL to TechDocs site'),
        }),
    },
    attributes: {
      readOnly: true,
      idempotent: true,
    },
    action: async ({ input }) => {
      // Removed logger and discovery from destructuring
      try {
        const result = await techDocsService.getTechDocsMetadataWithUrl(
          input.entityRef,
        );
        return { output: result };
      } catch (error) {
        logger.error('Error fetching TechDocs metadata:', error); // Use outer scope logger
        throw new Error(`Failed to get TechDocs metadata: ${error}`);
      }
    },
  });

  // Action: Check TechDocs coverage across the platform
  actionsRegistry.register({
    name: 'check-techdocs-coverage',
    title: 'Check TechDocs Coverage',
    description:
      'Analyze documentation coverage across entities to understand which entities lack documentation',
    schema: {
      input: z =>
        z.object({
          entityType: z
            .string()
            .optional()
            .describe('Filter by entity type (e.g., Component, API, System)'),
          namespace: z.string().optional().describe('Filter by namespace'),
        }),
      output: z =>
        z.object({
          total: z.number().describe('Total number of entities'),
          withDocs: z.number().describe('Number of entities with TechDocs'),
          withoutDocs: z
            .number()
            .describe('Number of entities without TechDocs'),
          coveragePercentage: z
            .number()
            .describe('Percentage of entities with documentation'),
          entitiesWithoutDocs: z
            .array(
              z.object({
                kind: z.string(),
                namespace: z.string(),
                name: z.string(),
                title: z.string().optional(),
              }),
            )
            .describe('List of entities without TechDocs'),
        }),
    },
    attributes: {
      readOnly: true,
      idempotent: true,
    },
    action: async ({ input }) => {
      // Removed logger from destructuring
      try {
        const result = await techDocsService.checkTechDocsCoverage({
          entityType: input.entityType,
          namespace: input.namespace,
        });

        return { output: result };
      } catch (error) {
        logger.error('Error analyzing TechDocs coverage:', error); // Use outer scope logger
        throw new Error(`Failed to check TechDocs coverage: ${error}`);
      }
    },
  });

  logger.info('TechDocs MCP actions registered successfully');
}
