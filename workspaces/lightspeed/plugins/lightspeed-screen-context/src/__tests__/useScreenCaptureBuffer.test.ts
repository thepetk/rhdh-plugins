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

import html2canvas from 'html2canvas';

import { act, renderHook, waitFor } from '@testing-library/react';

import { useScreenCaptureBuffer } from '../hooks/useScreenCaptureBuffer';

jest.mock('html2canvas');
const mockHtml2canvas = html2canvas as jest.MockedFunction<typeof html2canvas>;

function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.toDataURL = jest
    .fn()
    .mockReturnValue('data:image/png;base64,dGVzdA==');
  return canvas;
}

describe('useScreenCaptureBuffer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty screenshots when disabled', () => {
    const { result } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: false }),
    );

    expect(result.current.screenshots).toEqual([]);
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.captureError).toBeNull();
  });

  it('should capture a screenshot immediately when enabled', async () => {
    mockHtml2canvas.mockResolvedValue(createMockCanvas());

    const { result } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: true, intervalMs: 5000 }),
    );

    await waitFor(() => {
      expect(result.current.screenshots).toHaveLength(1);
    });

    expect(result.current.screenshots[0].attachment_type).toBe(
      'screen_context',
    );
    expect(result.current.screenshots[0].content_type).toBe('image/png');
  });

  it('should capture additional screenshots on timer intervals', async () => {
    mockHtml2canvas.mockResolvedValue(createMockCanvas());

    const { result } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: true, intervalMs: 1000 }),
    );

    // Wait for initial capture
    await waitFor(() => {
      expect(result.current.screenshots).toHaveLength(1);
    });

    // Advance timer for second capture
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.screenshots).toHaveLength(2);
    });
  });

  it('should cap the buffer at maxScreenshots', async () => {
    mockHtml2canvas.mockResolvedValue(createMockCanvas());

    const { result } = renderHook(() =>
      useScreenCaptureBuffer({
        enabled: true,
        intervalMs: 1000,
        maxScreenshots: 3,
      }),
    );

    // Wait for initial capture
    await waitFor(() => {
      expect(result.current.screenshots).toHaveLength(1);
    });

    // Advance through multiple intervals to exceed maxScreenshots
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      expect(result.current.screenshots.length).toBeLessThanOrEqual(3);
    });
  });

  it('should clear the buffer and stop capturing when disabled', async () => {
    mockHtml2canvas.mockResolvedValue(createMockCanvas());

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useScreenCaptureBuffer({ enabled, intervalMs: 1000 }),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => {
      expect(result.current.screenshots).toHaveLength(1);
    });

    // Disable
    rerender({ enabled: false });

    await waitFor(() => {
      expect(result.current.screenshots).toEqual([]);
    });

    // Advance timer — should not capture any more
    mockHtml2canvas.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockHtml2canvas).not.toHaveBeenCalled();
  });

  it('should clean up interval on unmount', async () => {
    mockHtml2canvas.mockResolvedValue(createMockCanvas());

    const { unmount } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: true, intervalMs: 1000 }),
    );

    await waitFor(() => {
      expect(mockHtml2canvas).toHaveBeenCalledTimes(1);
    });

    unmount();

    mockHtml2canvas.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockHtml2canvas).not.toHaveBeenCalled();
  });

  it('should handle capture errors gracefully', async () => {
    mockHtml2canvas.mockRejectedValue(new Error('Capture failed'));

    const { result } = renderHook(() =>
      useScreenCaptureBuffer({ enabled: true, intervalMs: 1000 }),
    );

    await waitFor(() => {
      expect(result.current.captureError).toBe('Capture failed');
    });

    // Buffer should remain empty since capture failed
    expect(result.current.screenshots).toEqual([]);
  });
});
