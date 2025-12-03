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
import { Position } from '@xyflow/react';
import { ActionNode } from '../Nodes/ActionNode';
import { ParametersNode } from '../Nodes/ParametersNode';
import { OutputNode } from '../Nodes/OutputNode';

// Centralized flow layout + node type definitions consumed across DesignerFlow.

export const FLOW_LAYOUT = {
  verticalSpacing: 400,
  fixedXPosition: 100,
} as const;

export const nodeTypes = {
  parametersNode: ParametersNode,
  actionNode: ActionNode,
  outputNode: OutputNode,
};

export const nodeDefaults = {
  sourcePosition: Position.Bottom,
  targetPosition: Position.Top,
};
