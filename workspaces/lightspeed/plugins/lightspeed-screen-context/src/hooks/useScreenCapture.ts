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

import { useCallback, useMemo, useState } from 'react';

import {
  CaptureOptions,
  ScreenContextAttachment,
  UseScreenCaptureReturn,
} from '../types';

const DEFAULT_OPTIONS: Required<CaptureOptions> = {
  // Ignore chatbot/lightspeed UI elements so they don't pollute context
  ignoreSelector:
    '.pf-chatbot, [class*="chatbot"], [class*="lightspeed-drawer"]',
  maxDepth: 30,
  includeHidden: false,
};

const SKIP_TAGS = new Set([
  'script',
  'style',
  'meta',
  'link',
  'noscript',
  'head',
  'svg',
  'path',
  'defs',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'g',
  'canvas',
]);

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const LIST_TAGS = new Set(['ul', 'ol']);

function isElementHidden(element: Element): boolean {
  try {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden';
  } catch {
    return false;
  }
}

function getCleanText(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function extractTable(table: Element): string[] {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return [];

  const tableData = rows.map(row =>
    Array.from(row.querySelectorAll('th, td')).map(cell =>
      getCleanText(cell).replace(/\|/g, '\\|'),
    ),
  );

  const colCount = Math.max(...tableData.map(r => r.length));
  if (colCount === 0) return [];

  const padRow = (cells: string[]) => {
    const padded = [...cells];
    while (padded.length < colCount) padded.push('');
    return `| ${padded.join(' | ')} |`;
  };

  const lines: string[] = [];
  lines.push(padRow(tableData[0]));
  lines.push(`|${Array(colCount).fill('---').join('|')}|`);
  for (let i = 1; i < tableData.length; i++) {
    lines.push(padRow(tableData[i]));
  }
  return lines;
}

function walkElement(
  element: Element,
  options: Required<CaptureOptions>,
  lines: string[],
  depth: number,
): void {
  if (depth > options.maxDepth) return;

  const tag = element.tagName.toLowerCase();

  if (SKIP_TAGS.has(tag)) return;
  if (!options.includeHidden && isElementHidden(element)) return;
  if (options.ignoreSelector && element.matches(options.ignoreSelector)) return;

  // Headings
  if (HEADING_TAGS.has(tag)) {
    const text = getCleanText(element);
    if (text) lines.push(`\n${'#'.repeat(parseInt(tag[1], 10))} ${text}`);
    return;
  }

  // Paragraph
  if (tag === 'p') {
    const text = getCleanText(element);
    if (text) lines.push(text);
    return;
  }

  // Button
  if (tag === 'button') {
    const text =
      getCleanText(element) || element.getAttribute('aria-label') || '';
    if (text) lines.push(`[Button: ${text}]`);
    return;
  }

  // Anchor / link
  if (tag === 'a') {
    const text = getCleanText(element);
    const href = element.getAttribute('href');
    if (text) lines.push(`[Link: ${text}${href ? ` → ${href}` : ''}]`);
    return;
  }

  // Input
  if (tag === 'input') {
    const type = element.getAttribute('type') || 'text';
    const ariaLabel =
      element.getAttribute('aria-label') ||
      element.getAttribute('placeholder') ||
      '';
    const value =
      type !== 'password' ? (element as HTMLInputElement).value : '***';
    const parts: string[] = [`[Input(${type})`];
    if (ariaLabel) parts.push(`: ${ariaLabel}`);
    if (value) parts.push(` = "${value}"`);
    parts.push(']');
    lines.push(parts.join(''));
    return;
  }

  // Select
  if (tag === 'select') {
    const ariaLabel = element.getAttribute('aria-label') || '';
    const sel = element as HTMLSelectElement;
    const selected = sel.options[sel.selectedIndex]?.text || '';
    lines.push(
      `[Select${ariaLabel ? `: ${ariaLabel}` : ''}${selected ? ` = "${selected}"` : ''}]`,
    );
    return;
  }

  // Textarea
  if (tag === 'textarea') {
    const ariaLabel =
      element.getAttribute('aria-label') ||
      element.getAttribute('placeholder') ||
      '';
    const value = (element as HTMLTextAreaElement).value;
    lines.push(
      `[Textarea${ariaLabel ? `: ${ariaLabel}` : ''}${value ? ` = "${value}"` : ''}]`,
    );
    return;
  }

  // Image
  if (tag === 'img') {
    const alt = element.getAttribute('alt');
    if (alt) lines.push(`[Image: ${alt}]`);
    return;
  }

  // Navigation landmark
  if (tag === 'nav' || element.getAttribute('role') === 'navigation') {
    const label = element.getAttribute('aria-label') || 'Navigation';
    lines.push(`\n[${label}]`);
    Array.from(element.querySelectorAll('a')).forEach(link => {
      const text = getCleanText(link);
      if (text) lines.push(`  - ${text}`);
    });
    return;
  }

  // Lists
  if (LIST_TAGS.has(tag)) {
    Array.from(element.children)
      .filter(child => child.tagName.toLowerCase() === 'li')
      .forEach(item => {
        const text = getCleanText(item);
        if (text) lines.push(`- ${text}`);
      });
    return;
  }

  // Table
  if (tag === 'table') {
    const tableLines = extractTable(element);
    if (tableLines.length > 0) {
      lines.push(...tableLines, '');
    }
    return;
  }

  // Recurse into children for all other container elements
  Array.from(element.children).forEach(child => {
    walkElement(child, options, lines, depth + 1);
  });
}

function extractDOMContext(options: Required<CaptureOptions>): string {
  const lines: string[] = [
    `Page: ${document.title}`,
    `URL: ${window.location.href}`,
    '',
  ];

  walkElement(document.body, options, lines, 0);

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Hook that provides DOM context extraction functionality.
 * Traverses the live DOM tree and returns a structured text representation
 * of the current page — no vision model required.
 *
 * @param options - Configuration options for DOM extraction
 * @returns Object with captureContext function, isCapturing state, and captureError
 */
export const useScreenCapture = (
  options: CaptureOptions = {},
): UseScreenCaptureReturn => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  /* eslint-disable react-hooks/exhaustive-deps */
  const mergedOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options.ignoreSelector, options.maxDepth, options.includeHidden],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const captureContext =
    useCallback(async (): Promise<ScreenContextAttachment | null> => {
      setIsCapturing(true);
      setCaptureError(null);

      try {
        const content = extractDOMContext(mergedOptions);
        return {
          attachment_type: 'api object',
          content_type: 'text/plain',
          content,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown DOM context capture error';
        setCaptureError(errorMessage);
        // eslint-disable-next-line no-console
        console.error('DOM context capture failed:', error);
        return null;
      } finally {
        setIsCapturing(false);
      }
    }, [mergedOptions]);

  return {
    captureContext,
    isCapturing,
    captureError,
  };
};
