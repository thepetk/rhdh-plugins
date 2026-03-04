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

import { snapdom } from '@zumer/snapdom';

import {
  CaptureOptions,
  ScreenContextAttachment,
  UseScreenCaptureReturn,
} from './types';

const DEFAULT_OPTIONS: CaptureOptions = {
  scale: 0.5,
  maxWidth: 1920,
  maxHeight: 1080,
  logging: false,
  // ignore elements that are likely to from the lightspeed chat
  ignoreSelector:
    '.pf-chatbot, [class*="chatbot"], [class*="lightspeed-drawer"]',
};

/**
 * Hook that provides screenshot capture functionality using snapdom.
 * Captures the current viewport and returns a base64-encoded PNG as a ScreenContextAttachment.
 *
 * @param options - Configuration options for screenshot capture
 * @returns Object with captureScreenshot function, isCapturing state, and captureError
 */
export const useScreenCapture = (
  options: CaptureOptions = {},
): UseScreenCaptureReturn => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  /* eslint-disable react-hooks/exhaustive-deps */
  const mergedOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [
      options.scale,
      options.maxWidth,
      options.maxHeight,
      options.logging,
      options.ignoreSelector,
    ],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const captureScreenshot =
    useCallback(async (): Promise<ScreenContextAttachment | null> => {
      setIsCapturing(true);
      setCaptureError(null);

      try {
        const canvas = await snapdom.toCanvas(document.body, {
          scale: mergedOptions.scale,
          // filterMode:'remove' is required
          // without it snapdom ignores the filter return value
          // and renders excluded elements anyway.
          filterMode: 'remove',
          filter: (el: Element) => {
            // iframes throw security errors and same-origin ones may trigger
            // browser prompts during rasterisation.
            if (el.tagName?.toLowerCase() === 'iframe') return false;
            if (
              mergedOptions.ignoreSelector &&
              el.matches(mergedOptions.ignoreSelector)
            )
              return false;
            return true;
          },
        });

        let finalCanvas = canvas;
        const maxW = mergedOptions.maxWidth ?? 1920;
        const maxH = mergedOptions.maxHeight ?? 1080;

        if (canvas.width > maxW || canvas.height > maxH) {
          const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
          const resized = document.createElement('canvas');
          resized.width = Math.floor(canvas.width * ratio);
          resized.height = Math.floor(canvas.height * ratio);
          const ctx = resized.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
            finalCanvas = resized;
          }
        }

        const dataUrl = finalCanvas.toDataURL('image/png');
        const base64Content = dataUrl.replace(/^data:image\/png;base64,/, '');

        return {
          attachment_type: 'screenshot',
          content_type: 'image/png',
          content: base64Content,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown screenshot capture error';
        setCaptureError(errorMessage);
        // eslint-disable-next-line no-console
        console.error('Screen capture failed:', error);
        return null;
      } finally {
        setIsCapturing(false);
      }
    }, [mergedOptions]);

  return {
    captureScreenshot,
    isCapturing,
    captureError,
  };
};
