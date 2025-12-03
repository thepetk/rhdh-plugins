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
export const SAMPLE_TEMPLATE_BLUEPRINT: Record<string, unknown> = {
  apiVersion: 'scaffolder.backstage.io/v1beta3',
  kind: 'Template',
  metadata: {
    name: 'sample-template',
    title: 'Sample Template',
    description: 'Start from a single-step scaffolder template.',
  },
  spec: {
    owner: 'user:guest',
    type: 'sample',
    parameters: [
      {
        title: 'Basic Information',
        properties: {
          message: {
            title: 'Message',
            type: 'string',
            description: 'Optional log message for the sample action.',
            default: 'Hello from Template Designer!',
          },
        },
      },
    ],
    steps: [
      {
        id: 'sample-action',
        name: 'Log Sample Message',
        action: 'debug:log',
        input: {
          message: '${{ parameters.message }}',
        },
      },
    ],
    output: {},
  },
};
