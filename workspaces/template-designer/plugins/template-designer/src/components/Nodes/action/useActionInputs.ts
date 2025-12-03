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
import { useMemo } from 'react';
import type { TaskStep } from '@backstage/plugin-scaffolder-common';
import type { ActionNodeData } from '../types';
import type { JsonSchemaProperty, NormalizedSchemaType } from './schema';
import {
  buildTypeLabel,
  extractEnumOptions,
  normalizeSchemaType,
} from './schema';

type ActionInputOption = {
  key: string;
  label: string;
  schema?: JsonSchemaProperty;
  type: NormalizedSchemaType;
};

type UseActionInputsArgs = {
  data: ActionNodeData;
  step: TaskStep;
  actionId: string;
  newKey: string;
};

export const useActionInputs = ({
  data,
  step,
  actionId,
  newKey,
}: UseActionInputsArgs) => {
  const actionInputSchema = useMemo(() => {
    if (!actionId) {
      return {} as Record<string, JsonSchemaProperty>;
    }
    const inputs = (data.scaffolderActionInputsById?.[actionId] ??
      {}) as Record<string, JsonSchemaProperty>;
    return inputs;
  }, [actionId, data.scaffolderActionInputsById]);

  const requiredInputKeys = useMemo(() => {
    if (!actionId) {
      return [] as string[];
    }
    const rawKeys = data.scaffolderActionInputRequiredById?.[actionId];
    if (!Array.isArray(rawKeys)) {
      return [];
    }
    return rawKeys;
  }, [actionId, data.scaffolderActionInputRequiredById]);

  const actionInputOptions = useMemo<ActionInputOption[]>(() => {
    return Object.entries(actionInputSchema).map(([key, schema]) => {
      const normalized = normalizeSchemaType(schema);
      const label = buildTypeLabel(schema);
      return {
        key,
        label: label ? `${key} (${label})` : key,
        schema,
        type: normalized,
      };
    });
  }, [actionInputSchema]);

  const inputEntries = useMemo(
    () => Object.entries(step.input ?? {}),
    [step.input],
  );
  const usedInputKeys = useMemo(
    () => new Set(inputEntries.map(([key]) => key)),
    [inputEntries],
  );
  const availableInputOptions = useMemo(
    () => actionInputOptions.filter(option => !usedInputKeys.has(option.key)),
    [actionInputOptions, usedInputKeys],
  );
  const trimmedNewKey = newKey.trim();
  const selectedNewKeyOption = useMemo(
    () =>
      availableInputOptions.find(option => option.key === trimmedNewKey) ??
      null,
    [availableInputOptions, trimmedNewKey],
  );

  const newKeySchema =
    selectedNewKeyOption?.schema ??
    (trimmedNewKey ? actionInputSchema?.[trimmedNewKey] : undefined);
  const newKeyNormalizedType = normalizeSchemaType(newKeySchema);
  const newKeyTypeLabel = buildTypeLabel(newKeySchema) || 'String';
  const newKeyEnumOptions = extractEnumOptions(newKeySchema);

  const missingRequiredInputKeys = useMemo(
    () =>
      requiredInputKeys.filter(
        key => typeof key === 'string' && !usedInputKeys.has(key),
      ),
    [requiredInputKeys, usedInputKeys],
  );

  return {
    actionInputSchema,
    actionInputOptions,
    inputEntries,
    usedInputKeys,
    requiredInputKeys,
    missingRequiredInputKeys,
    availableInputOptions,
    trimmedNewKey,
    selectedNewKeyOption,
    newKeySchema,
    newKeyNormalizedType,
    newKeyTypeLabel,
    newKeyEnumOptions,
  };
};
