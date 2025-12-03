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
import { parse, stringify } from 'yaml';

export const convertJsonToYaml = (value: unknown): string => {
  let source = value;

  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) {
      source = {};
    } else {
      try {
        source = JSON.parse(trimmed);
      } catch (error) {
        throw new Error(
          `Invalid JSON input provided for YAML conversion: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }
  }

  return stringify(source ?? {});
};

export const convertYamlToJson = (value: unknown): string => {
  let source = value;

  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) {
      source = {};
    } else {
      try {
        source = parse(trimmed);
      } catch (error) {
        throw new Error(
          `Invalid YAML input provided for JSON conversion: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }
  }

  try {
    return JSON.stringify(source ?? {});
  } catch (error) {
    throw new Error(
      `Unable to serialize value to JSON: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    );
  }
};
