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

import { UIContextAttachment } from './types';

interface TreeNode {
  name: string;
  children: TreeNode[];
}

/**
 * Reads the React fiber root from a DOM element by looking for the internal
 * property React attaches at runtime (__reactFiber* in React 17+,
 * __reactInternalInstance* in React 16).
 */
function getFiber(el: Element): any {
  const key = Object.keys(el).find(
    k =>
      k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'),
  );
  return key ? (el as any)[key] : null;
}

/**
 * Walks the React fiber tree depth-first up to `maxDepth` levels, building a
 * lightweight name-only tree. Nodes whose display name matches
 * chatbot/lightspeed/drawer are pruned so the LLM only sees the host
 * application's component structure, not the assistant UI itself.
 */
function traverseFiber(fiber: any, depth = 0, maxDepth = 10): TreeNode | null {
  if (!fiber || depth > maxDepth) return null;
  const name =
    typeof fiber.type === 'string'
      ? fiber.type
      : (fiber.type?.displayName ?? fiber.type?.name ?? null);
  // Exclude the Lightspeed chatbot/drawer UI from the tree so the LLM
  // receives context about the host page, not the assistant itself.
  if (name && /chatbot|lightspeed|drawer/i.test(name)) return null;

  const children: TreeNode[] = [];
  let child = fiber.child;
  while (child) {
    const node = traverseFiber(child, depth + 1, maxDepth);
    if (node) children.push(node);
    child = child.sibling;
  }
  if (!name) return children.length ? { name: '(fragment)', children } : null;
  return { name, children };
}

/**
 * Extracts the current React component tree from the page and returns it as a
 * UIContextAttachment ready to be sent alongside the user's message.
 *
 * attachment_type is 'configuration' — the closest semantic match in the
 * lightspeed-stack ATTACHMENT_TYPES frozenset for a structured UI description.
 * content is plain JSON (not base64) so the LLM can read it directly; the
 * lightspeed-stack appends attachment content verbatim to the prompt.
 *
 * Returns null if the fiber root cannot be found or traversal fails.
 */
export function extractReactTree(): UIContextAttachment | null {
  try {
    const fiber = getFiber(document.body);
    if (!fiber) return null;
    const tree = traverseFiber(fiber);
    if (!tree) return null;
    const payload = {
      route: window.location.pathname,
      title: document.title,
      componentTree: tree,
    };
    return {
      attachment_type: 'configuration',
      content_type: 'application/json',
      content: JSON.stringify(payload),
    };
  } catch {
    return null;
  }
}
