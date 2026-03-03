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

function getFiber(el: Element): any {
  const key = Object.keys(el).find(
    k =>
      k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'),
  );
  return key ? (el as any)[key] : null;
}

function traverseFiber(fiber: any, depth = 0, maxDepth = 10): TreeNode | null {
  if (!fiber || depth > maxDepth) return null;
  const name =
    typeof fiber.type === 'string'
      ? fiber.type
      : (fiber.type?.displayName ?? fiber.type?.name ?? null);
  // exclude chatbot/lightspeed UI from the tree
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
      attachment_type: 'ui_context',
      content_type: 'application/json',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(payload)))),
    };
  } catch {
    return null;
  }
}
