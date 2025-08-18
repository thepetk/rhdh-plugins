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
import express, {
  type Request,
  type Response,
  type RequestHandler,
} from 'express';
import type { Config } from '@backstage/config';
import { LoggerService, DiscoveryService } from '@backstage/backend-plugin-api';
import { Publisher } from '@backstage/plugin-techdocs-node';

type TechdocsParams = {
  namespace: string;
  kind: string;
  name: string;
  path?: string;
};

export async function createRouter(opts: {
  config: Config;
  logger: LoggerService;
  discovery: DiscoveryService;
}) {
  const { config, logger, discovery } = opts;
  const router = express.Router();

  const publisher = await Publisher.fromConfig(config, { logger, discovery });

  router.use('/static/docs', await publisher.docsRouter());

  const techdocsHandler: RequestHandler<TechdocsParams> = (req, res, next) => {
    try {
      const { namespace, kind, name, path } = req.params;
      const docPath = path && path.length > 0 ? path : 'index.html';
      req.url = `/static/docs/${namespace}/${kind}/${name}/${docPath}`;
      next();
      return;
    } catch (e) {
      logger.error(e);
      res.status(500).json({ error: String(e) });
      return;
    }
  };

  router.get(
    '/techdocs/:namespace/:kind/:name/metadata',
    async (req: Request<TechdocsParams>, res: Response) => {
      const { namespace, kind, name } = req.params;
      try {
        const metadata = await publisher.fetchTechDocsMetadata({
          namespace,
          kind,
          name,
        });
        return res.json(metadata);
      } catch (e) {
        logger.error(e);
        return res.status(500).json({ error: String(e) });
      }
    },
  );

  router.get('/techdocs/:namespace/:kind/:name/:path(*)?', techdocsHandler);

  router.get('/health', async (_req, res) => {
    const ready = await publisher.getReadiness();
    return res.json({ ready });
  });

  return router;
}
