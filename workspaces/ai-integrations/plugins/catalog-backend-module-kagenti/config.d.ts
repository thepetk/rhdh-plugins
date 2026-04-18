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
import { SchedulerServiceTaskScheduleDefinitionConfig } from '@backstage/backend-plugin-api';

export interface Config {
  catalog?: {
    providers?: {
      kagenti?: {
        [key: string]: {
          /** Base URL of the Kagenti backend API */
          baseUrl: string;
          /** OAuth2 Client ID for Keycloak Client Credentials Grant */
          clientId: string;
          /**
           * OAuth2 Client Secret for Keycloak Client Credentials Grant
           * @visibility secret
           */
          clientSecret: string;
          /** Keycloak token endpoint URL */
          tokenUrl: string;
          /** Optional list of namespaces to sync. Omit to sync all namespaces. */
          namespaces?: string[];
          /** Maps namespace names to Backstage lifecycle values */
          lifecycleMapping?: { [namespace: string]: string };
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
      };
    };
  };
}
