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

// elements whose content adds no useful context for the LLM.
// NOTE: testing showed that the elements below are confusing
// the LLM and produce worse results.
const NOISE_SELECTOR = 'script, style, noscript, svg, canvas, img, video';

/**
 * Captures the current page DOM as a UIContextAttachment.
 *
 * Clones document.body, strips non-content nodes (scripts, styles, SVGs,
 * media), and serialises the remaining HTML so the LLM can read the full
 * page structure including any visible warnings, alerts, and text.
 *
 * Returns null if serialisation fails.
 */
export function extractReactTree(): UIContextAttachment | null {
  try {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(NOISE_SELECTOR).forEach(el => el.remove());

    const payload = {
      route: window.location.pathname,
      title: document.title,
      dom: clone.innerHTML,
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
