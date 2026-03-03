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
} from './types';
import { useScreenCapture } from './useScreenCapture';

const DEFAULT_INTERVAL_MS = 30000;
const DEFAULT_MAX_SCREENSHOTS = 5;

/**
 * Hook that continuously captures screenshots on a timer and maintains a rolling buffer.
 *
 * - Keeps only the most recent `maxScreenshots`
 * - Prevents overlapping captures (async + setInterval race)
 * - Drops stale/late results if a newer capture tick started after it
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

  // Monotonic sequence used to drop stale/late async results.
  const latestSeqRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = [];
      setScreenshots([]);
      return () => {};
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      const seq = ++latestSeqRef.current;

      try {
        const screenshot = await captureScreenshot();

        // If a newer tick started while we were awaiting, ignore this result.
        if (cancelled || seq !== latestSeqRef.current) return;

        if (screenshot) {
          const updated = [...bufferRef.current, screenshot].slice(
            -maxScreenshots,
          );
          bufferRef.current = updated;
          setScreenshots(updated);
        }
      } finally {
        if (!cancelled) {
          // Schedule next run *after* this run finishes to avoid overlap.
          timeoutId = setTimeout(tick, intervalMs);
        }
      }
    };

    // Capture immediately when enabled.
    void tick();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, intervalMs, maxScreenshots, captureScreenshot]);

  return {
    screenshots,
    isCapturing,
    captureError,
  };
};
