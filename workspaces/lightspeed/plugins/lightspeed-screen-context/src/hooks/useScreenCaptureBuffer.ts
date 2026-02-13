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

import { useEffect, useRef, useState } from 'react';

import {
  ScreenContextAttachment,
  UseScreenCaptureBufferOptions,
  UseScreenCaptureBufferReturn,
} from '../types';
import { useScreenCapture } from './useScreenCapture';

const DEFAULT_INTERVAL_MS = 30000;
const DEFAULT_MAX_SCREENSHOTS = 5;

/**
 * Hook that continuously captures screenshots on a timer and maintains a rolling buffer.
 *
 * @param options - Configuration including enabled state, interval, and buffer size
 * @returns Object with screenshots buffer, isCapturing state, and captureError
 */
export const useScreenCaptureBuffer = (
  options: UseScreenCaptureBufferOptions,
): UseScreenCaptureBufferReturn => {
  const {
    enabled,
    intervalMs = DEFAULT_INTERVAL_MS,
    maxScreenshots = DEFAULT_MAX_SCREENSHOTS,
    ...captureOptions
  } = options;

  const { captureScreenshot, isCapturing, captureError } =
    useScreenCapture(captureOptions);
  const bufferRef = useRef<ScreenContextAttachment[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenContextAttachment[]>([]);

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = [];
      setScreenshots([]);
      return undefined;
    }

    const capture = async () => {
      const screenshot = await captureScreenshot();
      if (screenshot) {
        const updated = [...bufferRef.current, screenshot].slice(
          -maxScreenshots,
        );
        bufferRef.current = updated;
        setScreenshots(updated);
      }
    };

    // Capture immediately when enabled
    capture();

    const intervalId = setInterval(capture, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, maxScreenshots]);

  return {
    screenshots,
    isCapturing,
    captureError,
  };
};
