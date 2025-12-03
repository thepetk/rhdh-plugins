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
import { Edge, Node } from '@xyflow/react';

export function createSequentialEdges(nodes: Node[]): Edge[] {
  if (nodes.length < 2) return [];

  return nodes.slice(0, -1).map((node, index) => {
    const nextNode = nodes[index + 1];
    return {
      id: `e-${node.id}-${nextNode.id}`,
      source: node.id,
      target: nextNode.id,
      type: 'smoothstep',
    } as Edge;
  });
}
