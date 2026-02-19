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

import { act, renderHook, waitFor } from '@testing-library/react';

import { useScreenCaptureBuffer } from '../hooks/useScreenCaptureBuffer';

const mockCaptureContext = jest.fn();

jest.mock('../hooks/useScreenCapture', () => ({
  useScreenCapture: () => ({
    captureContext: mockCaptureContext,
    isCapturing: false,
    captureError: null,
  }),
}));

const mockSnapshot = {
  attachment_type: 'dom-context' as const,
  content_type: 'text/plain' as const,
  content: 'Page: Test\nURL: http://localhost\n\nContent',
};

describe('useScreenCaptureBuffer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty snapshots when disabled', () => {
    const { result } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: false }),
    );

    expect(result.current.snapshots).toEqual([]);
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.captureError).toBeNull();
  });

  it('should capture a snapshot immediately when enabled', async () => {
    mockCaptureContext.mockResolvedValue(mockSnapshot);

    const { result } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: true, intervalMs: 5000 }),
    );

    await waitFor(() => {
      expect(result.current.snapshots).toHaveLength(1);
    });

    expect(result.current.snapshots[0].attachment_type).toBe('dom-context');
    expect(result.current.snapshots[0].content_type).toBe('text/plain');
  });

  it('should capture additional snapshots on timer intervals', async () => {
    mockCaptureContext.mockResolvedValue(mockSnapshot);

    const { result } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: true, intervalMs: 1000 }),
    );

    await waitFor(() => {
      expect(result.current.snapshots).toHaveLength(1);
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.snapshots).toHaveLength(2);
    });
  });

  it('should cap the buffer at maxSnapshots', async () => {
    mockCaptureContext.mockResolvedValue(mockSnapshot);

    const { result } = renderHook(() =>
      useScreenCaptureBuffer({
        enabled: true,
        intervalMs: 1000,
        maxSnapshots: 3,
      }),
    );

    await waitFor(() => {
      expect(result.current.snapshots).toHaveLength(1);
    });

    for (let i = 0; i < 4; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      expect(result.current.snapshots.length).toBeLessThanOrEqual(3);
    });
  });

  it('should clear the buffer and stop capturing when disabled', async () => {
    mockCaptureContext.mockResolvedValue(mockSnapshot);

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useScreenCaptureBuffer({ enabled, intervalMs: 1000 }),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => {
      expect(result.current.snapshots).toHaveLength(1);
    });

    rerender({ enabled: false });

    await waitFor(() => {
      expect(result.current.snapshots).toEqual([]);
    });

    mockCaptureContext.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockCaptureContext).not.toHaveBeenCalled();
  });

  it('should clean up interval on unmount', async () => {
    mockCaptureContext.mockResolvedValue(mockSnapshot);

    const { unmount } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: true, intervalMs: 1000 }),
    );

    await waitFor(() => {
      expect(mockCaptureContext).toHaveBeenCalledTimes(1);
    });

    unmount();

    mockCaptureContext.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockCaptureContext).not.toHaveBeenCalled();
  });

  it('should not add to buffer when captureContext returns null', async () => {
    mockCaptureContext.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: true, intervalMs: 1000 }),
    );

    await waitFor(() => {
      expect(mockCaptureContext).toHaveBeenCalled();
    });

    expect(result.current.snapshots).toEqual([]);
  });
});
