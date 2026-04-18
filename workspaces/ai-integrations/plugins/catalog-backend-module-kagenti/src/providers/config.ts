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
import { readSchedulerServiceTaskScheduleDefinitionFromConfig } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';

import type { KagentiConfig } from './types';

/**
 * readKagentiEntityConfigs reads the configuration for the Kagenti provider
 *
 * @public
 */
export function readKagentiEntityConfigs(config: Config): KagentiConfig[] {
  const providerConfigs = config.getOptionalConfig('catalog.providers.kagenti');
  if (!providerConfigs) {
    return [];
  }
  return providerConfigs
    .keys()
    .map(id => readKagentiEntityConfig(id, providerConfigs.getConfig(id)));
}

function readKagentiEntityConfig(id: string, config: Config): KagentiConfig {
  const baseUrl = config.getString('baseUrl');
  const clientId = config.getString('clientId');
  const clientSecret = config.getString('clientSecret');
  const tokenUrl = config.getString('tokenUrl');

  const namespaces = config.has('namespaces')
    ? config.getStringArray('namespaces')
    : undefined;

  const lifecycleMapping = config.has('lifecycleMapping')
    ? (config.get('lifecycleMapping') as Record<string, string>)
    : undefined;

  const schedule = config.has('schedule')
    ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
        config.getConfig('schedule'),
      )
    : undefined;

  return {
    id,
    baseUrl,
    clientId,
    clientSecret,
    tokenUrl,
    namespaces,
    lifecycleMapping,
    schedule,
  };
}
