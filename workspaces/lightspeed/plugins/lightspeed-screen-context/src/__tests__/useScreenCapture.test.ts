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

import { useScreenCapture } from '../hooks/useScreenCapture';

describe('useScreenCapture', () => {
  beforeEach(() => {
    document.title = 'Test Page';
    document.body.innerHTML = '';
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useScreenCapture());

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.captureError).toBeNull();
    expect(typeof result.current.captureContext).toBe('function');
  });

  it('should return a ScreenContextAttachment with correct shape', async () => {
    document.body.innerHTML = '<h1>Hello World</h1><p>Some content</p>';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment).not.toBeNull();
    expect(attachment.attachment_type).toBe('dom-context');
    expect(attachment.content_type).toBe('text/plain');
    expect(typeof attachment.content).toBe('string');
  });

  it('should include page title and URL in content', async () => {
    document.title = 'My Backstage App';
    document.body.innerHTML = '<p>Content here</p>';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('Page: My Backstage App');
  });

  it('should extract heading text with markdown prefix', async () => {
    document.body.innerHTML =
      '<h1>Main Title</h1><h2>Subtitle</h2><h3>Section</h3>';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('# Main Title');
    expect(attachment.content).toContain('## Subtitle');
    expect(attachment.content).toContain('### Section');
  });

  it('should extract paragraph text', async () => {
    document.body.innerHTML = '<p>This is a paragraph.</p>';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('This is a paragraph.');
  });

  it('should format buttons as [Button: label]', async () => {
    document.body.innerHTML =
      '<button>Click me</button><button aria-label="Close dialog"></button>';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('[Button: Click me]');
    expect(attachment.content).toContain('[Button: Close dialog]');
  });

  it('should format links as [Link: text → href]', async () => {
    document.body.innerHTML = '<a href="/catalog">Go to Catalog</a>';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('[Link: Go to Catalog → /catalog]');
  });

  it('should format text inputs with aria-label', async () => {
    document.body.innerHTML =
      '<input type="text" aria-label="Search components" />';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('[Input(text): Search components]');
  });

  it('should redact password input values', async () => {
    document.body.innerHTML =
      '<input type="password" aria-label="Password" value="secret" />';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).not.toContain('secret');
    expect(attachment.content).toContain('***');
  });

  it('should format images with alt text', async () => {
    document.body.innerHTML = '<img src="/logo.png" alt="Company Logo" />';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('[Image: Company Logo]');
  });

  it('should format list items with bullet prefix', async () => {
    document.body.innerHTML =
      '<ul><li>First item</li><li>Second item</li></ul>';

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('- First item');
    expect(attachment.content).toContain('- Second item');
  });

  it('should format tables as markdown tables', async () => {
    document.body.innerHTML = `
      <table>
        <tr><th>Name</th><th>Kind</th></tr>
        <tr><td>my-service</td><td>Component</td></tr>
      </table>
    `;

    const { result } = renderHook(() => useScreenCapture());

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('| Name | Kind |');
    expect(attachment.content).toContain('| my-service | Component |');
  });

  it('should exclude elements matching ignoreSelector', async () => {
    document.body.innerHTML = `
      <h1>Main Content</h1>
      <div class="pf-chatbot"><p>Chat UI text</p></div>
    `;

    const { result } = renderHook(() =>
      useScreenCapture({ ignoreSelector: '.pf-chatbot' }),
    );

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    expect(attachment.content).toContain('Main Content');
    expect(attachment.content).not.toContain('Chat UI text');
  });

  it('should set isCapturing to false after capture completes', async () => {
    const { result } = renderHook(() => useScreenCapture());

    await act(async () => {
      await result.current.captureContext();
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.captureError).toBeNull();
  });

  it('should set captureError and return null when extraction throws', async () => {
    const { result } = renderHook(() => useScreenCapture());

    // Override document.body on the instance so extractDOMContext throws.
    // Use configurable:true so we can delete it afterwards, falling back to the
    // prototype getter and leaving jsdom in a clean state.
    Object.defineProperty(document, 'body', {
      get() {
        throw new Error('DOM access error');
      },
      configurable: true,
    });

    let attachment: any;
    try {
      await act(async () => {
        attachment = await result.current.captureContext();
      });
    } finally {
      delete (document as any).body;
    }

    expect(attachment).toBeNull();

    await waitFor(() => {
      expect(result.current.captureError).toBe('DOM access error');
    });
    expect(result.current.isCapturing).toBe(false);
  });

  it('should clear previous error on a successful capture', async () => {
    const { result } = renderHook(() => useScreenCapture());

    // Force a failure first
    Object.defineProperty(document, 'body', {
      get() {
        throw new Error('First failure');
      },
      configurable: true,
    });

    try {
      await act(async () => {
        await result.current.captureContext();
      });
    } finally {
      delete (document as any).body;
    }

    await waitFor(() => {
      expect(result.current.captureError).toBe('First failure');
    });

    // Successful capture should clear the error
    await act(async () => {
      await result.current.captureContext();
    });

    await waitFor(() => {
      expect(result.current.captureError).toBeNull();
    });
  });

  it('should use custom maxDepth option', async () => {
    // Deep nesting beyond maxDepth=1 should not reach inner content
    document.body.innerHTML = `
      <div>
        <div>
          <p>Deep paragraph</p>
        </div>
      </div>
    `;

    const { result } = renderHook(() => useScreenCapture({ maxDepth: 1 }));

    let attachment: any;
    await act(async () => {
      attachment = await result.current.captureContext();
    });

    // With maxDepth=1 the <p> at depth 2+ won't be reached
    expect(attachment.content).not.toContain('Deep paragraph');
  });
});
