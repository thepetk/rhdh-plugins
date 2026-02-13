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

export const buildScreenContextPrompt = (
  userMessage: string,
  screenshots: ScreenContextAttachment[],
): string => {
  if (screenshots.length === 0) return userMessage;

  const screenshotEntries = screenshots
    .map((s, i) => `[screenshot_${i + 1}]\n${s.content}`)
    .join('\n\n');

  return `${userMessage}\n\n[SCREEN_CONTEXT]\nThe following are base64-encoded PNG screenshots of the user's current screen, captured at regular intervals (most recent last). Use these to understand the visual context of what the user is seeing.\n\n${screenshotEntries}\n[/SCREEN_CONTEXT]`;
};
