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
const DEFAULT_MAX_SNAPSHOTS = 5;

/**
 * Hook that continuously captures DOM context on a timer and maintains a rolling buffer.
 *
 * @param options - Configuration including enabled state, interval, and buffer size
 * @returns Object with snapshots buffer, isCapturing state, and captureError
 */
export const useScreenCaptureBuffer = (
  options: UseScreenCaptureBufferOptions,
): UseScreenCaptureBufferReturn => {
  const {
    enabled,
    intervalMs = DEFAULT_INTERVAL_MS,
    maxSnapshots = DEFAULT_MAX_SNAPSHOTS,
    ...captureOptions
  } = options;

  const { captureContext, isCapturing, captureError } =
    useScreenCapture(captureOptions);
  const bufferRef = useRef<ScreenContextAttachment[]>([]);
  const [snapshots, setSnapshots] = useState<ScreenContextAttachment[]>([]);

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = [];
      setSnapshots([]);
      return undefined;
    }

    const capture = async () => {
      const snapshot = await captureContext();
      if (snapshot) {
        const updated = [...bufferRef.current, snapshot].slice(-maxSnapshots);
        bufferRef.current = updated;
        setSnapshots(updated);
      }
    };

    // Capture immediately when enabled
    capture();

    const intervalId = setInterval(capture, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, maxSnapshots]);

  return {
    snapshots,
    isCapturing,
    captureError,
  };
};
