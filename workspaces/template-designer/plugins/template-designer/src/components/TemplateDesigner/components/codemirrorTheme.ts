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
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import type { Theme } from '@material-ui/core/styles';

export const createCodeMirrorTheme = (
  materialTheme: Theme,
  paletteMode: 'light' | 'dark',
): Extension =>
  EditorView.theme(
    {
      '&': {
        backgroundColor: materialTheme.palette.background.paper,
        color: materialTheme.palette.text.primary,
      },
      '.cm-content': {
        fontFamily: '"Roboto Mono", "SFMono-Regular", Consolas, monospace',
      },
      '.cm-scroller': {
        fontSize: 13,
        lineHeight: 1.5,
      },
      '.cm-gutters': {
        backgroundColor: materialTheme.palette.background.paper,
        color: materialTheme.palette.text.secondary,
        borderRight: `1px solid ${materialTheme.palette.divider}`,
      },
      '&.cm-editor.cm-focused': {
        outline: `1px solid ${materialTheme.palette.primary.main}`,
        outlineOffset: 0,
      },
    },
    { dark: paletteMode === 'dark' },
  );
