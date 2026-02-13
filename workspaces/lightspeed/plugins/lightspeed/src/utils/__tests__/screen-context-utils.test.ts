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

// eslint-disable-next-line @backstage/no-mixed-plugin-imports
import { ScreenContextAttachment } from '@red-hat-developer-hub/backstage-plugin-lightspeed-screen-context';

import { buildScreenContextPrompt } from '../screen-context-utils';

const makeScreenshot = (content: string): ScreenContextAttachment => ({
  attachment_type: 'screen_context',
  content_type: 'image/png',
  content,
});

describe('buildScreenContextPrompt', () => {
  it('should return the original message when screenshots array is empty', () => {
    const result = buildScreenContextPrompt('Hello world', []);
    expect(result).toBe('Hello world');
  });

  it('should embed a single screenshot into the prompt', () => {
    const screenshots = [makeScreenshot('base64data1')];
    const result = buildScreenContextPrompt('What is this?', screenshots);

    expect(result).toContain('What is this?');
    expect(result).toContain('[SCREEN_CONTEXT]');
    expect(result).toContain('[/SCREEN_CONTEXT]');
    expect(result).toContain('[screenshot_1]');
    expect(result).toContain('base64data1');
    expect(result).not.toContain('[screenshot_2]');
  });

  it('should embed multiple screenshots into the prompt', () => {
    const screenshots = [
      makeScreenshot('img1'),
      makeScreenshot('img2'),
      makeScreenshot('img3'),
      makeScreenshot('img4'),
      makeScreenshot('img5'),
    ];
    const result = buildScreenContextPrompt('Describe my screen', screenshots);

    expect(result).toContain('Describe my screen');
    expect(result).toContain('[SCREEN_CONTEXT]');
    expect(result).toContain('[/SCREEN_CONTEXT]');
    for (let i = 1; i <= 5; i++) {
      expect(result).toContain(`[screenshot_${i}]`);
      expect(result).toContain(`img${i}`);
    }
  });

  it('should include the descriptive text about screenshots', () => {
    const screenshots = [makeScreenshot('data')];
    const result = buildScreenContextPrompt('test', screenshots);

    expect(result).toContain(
      "base64-encoded PNG screenshots of the user's current screen",
    );
    expect(result).toContain('most recent last');
  });
});
