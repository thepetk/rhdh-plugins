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

import { useScreenCapture } from '../hooks/useScreenCapture';

jest.mock('html2canvas');
const mockHtml2canvas = html2canvas as jest.MockedFunction<typeof html2canvas>;

function createMockCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // jsdom doesn't support real canvas rendering, so mock toDataURL
  canvas.toDataURL = jest
    .fn()
    .mockReturnValue('data:image/png;base64,dGVzdA==');
  return canvas;
}

describe('useScreenCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useScreenCapture());

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.captureError).toBeNull();
    expect(typeof result.current.captureScreenshot).toBe('function');
  });

  it('should capture a screenshot and return a ScreenContextAttachment', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const { result } = renderHook(() => useScreenCapture());

    let screenshot: any;
    await act(async () => {
      screenshot = await result.current.captureScreenshot();
    });

    expect(screenshot).not.toBeNull();
    expect(screenshot.attachment_type).toBe('screen_context');
    expect(screenshot.content_type).toBe('image/png');
    expect(typeof screenshot.content).toBe('string');
    // Should not contain the data URI prefix
    expect(screenshot.content).not.toContain('data:image/png;base64,');
  });

  it('should call html2canvas with correct options', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const { result } = renderHook(() => useScreenCapture());

    await act(async () => {
      await result.current.captureScreenshot();
    });

    expect(mockHtml2canvas).toHaveBeenCalledWith(
      document.body,
      expect.objectContaining({
        scale: 0.5,
        logging: false,
        useCORS: true,
        allowTaint: false,
        ignoreElements: expect.any(Function),
      }),
    );
  });

  it('should set isCapturing to false after capture completes', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const { result } = renderHook(() => useScreenCapture());

    await act(async () => {
      await result.current.captureScreenshot();
    });

    expect(result.current.isCapturing).toBe(false);
  });

  it('should return null and set captureError on failure', async () => {
    mockHtml2canvas.mockRejectedValue(new Error('Canvas rendering failed'));

    const { result } = renderHook(() => useScreenCapture());

    let screenshot: any;
    await act(async () => {
      screenshot = await result.current.captureScreenshot();
    });

    expect(screenshot).toBeNull();

    await waitFor(() => {
      expect(result.current.captureError).toBe('Canvas rendering failed');
    });
    expect(result.current.isCapturing).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    mockHtml2canvas.mockRejectedValue('some string error');

    const { result } = renderHook(() => useScreenCapture());

    let screenshot: any;
    await act(async () => {
      screenshot = await result.current.captureScreenshot();
    });

    expect(screenshot).toBeNull();

    await waitFor(() => {
      expect(result.current.captureError).toBe(
        'Unknown screenshot capture error',
      );
    });
  });

  it('should use custom options when provided', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const customOptions = { scale: 1.0, logging: true };
    const { result } = renderHook(() => useScreenCapture(customOptions));

    await act(async () => {
      await result.current.captureScreenshot();
    });

    expect(mockHtml2canvas).toHaveBeenCalledWith(
      document.body,
      expect.objectContaining({
        scale: 1.0,
        logging: true,
      }),
    );
  });

  it('should pass ignoreElements function that matches the selector', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const { result } = renderHook(() =>
      useScreenCapture({ ignoreSelector: '.my-chatbot' }),
    );

    await act(async () => {
      await result.current.captureScreenshot();
    });

    const call = mockHtml2canvas.mock.calls[0];
    const options = call[1] as any;
    const ignoreElements = options.ignoreElements;

    const matchingElement = document.createElement('div');
    matchingElement.className = 'my-chatbot';
    document.body.appendChild(matchingElement);

    expect(ignoreElements(matchingElement)).toBe(true);

    const nonMatchingElement = document.createElement('div');
    nonMatchingElement.className = 'other-element';
    document.body.appendChild(nonMatchingElement);

    expect(ignoreElements(nonMatchingElement)).toBe(false);

    document.body.removeChild(matchingElement);
    document.body.removeChild(nonMatchingElement);
  });

  it('should clear previous error on new capture attempt', async () => {
    // First capture fails
    mockHtml2canvas.mockRejectedValueOnce(new Error('First failure'));

    const { result } = renderHook(() => useScreenCapture());

    await act(async () => {
      await result.current.captureScreenshot();
    });

    await waitFor(() => {
      expect(result.current.captureError).toBe('First failure');
    });

    // Second capture succeeds
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValueOnce(mockCanvas);

    await act(async () => {
      await result.current.captureScreenshot();
    });

    await waitFor(() => {
      expect(result.current.captureError).toBeNull();
    });
  });
});
