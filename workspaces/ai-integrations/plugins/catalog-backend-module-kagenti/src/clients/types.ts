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

export interface KagentiAgent {
  name: string;
  namespace: string;
  createdAt?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  url?: string;
}

export interface KagentiNamespace {
  name: string;
}

export interface KagentiAgentCard {
  name: string;
  description?: string;
  version: string;
  url: string;
  streaming: boolean;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    examples: string[];
  }>;
}

export interface KagentiDashboards {
  traces_dashboard_url?: string;
  network_dashboard_url?: string;
  mlflow_dashboard_url?: string;
}

export interface KagentiRouteStatus {
  hasRoute: boolean;
  url?: string;
}
