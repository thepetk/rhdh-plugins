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

import html2canvas from 'html2canvas';

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
  // Ignore elements that are likely to be chatbots or similar interactive widgets
  // to avoid capturing them in screenshots
  ignoreSelector:
    '.pf-chatbot, [class*="chatbot"], [class*="lightspeed-drawer"]',
};

/**
 * Hook that provides screenshot capture functionality using html2canvas.
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
        const canvas = await html2canvas(document.body, {
          scale: mergedOptions.scale,
          logging: mergedOptions.logging,
          useCORS: true,
          allowTaint: false,
          ignoreElements: (element: Element) => {
            if (mergedOptions.ignoreSelector) {
              return element.matches(mergedOptions.ignoreSelector);
            }
            return false;
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
          attachment_type: 'screen_context',
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
