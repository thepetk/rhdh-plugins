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
import Popper from '@material-ui/core/Popper';
import type { PopperProps } from '@material-ui/core/Popper';

// Popper that allows Autocomplete dropdowns to expand beyond the input width while
// keeping a minimum width equal to the anchor element.
export const AutoWidthPopper = (props: PopperProps) => {
  const { style, anchorEl, ...restProps } = props;

  const anchorWidth =
    anchorEl && 'clientWidth' in anchorEl
      ? (anchorEl as HTMLElement).clientWidth
      : undefined;

  return (
    <Popper
      {...restProps}
      anchorEl={anchorEl}
      style={{
        ...style,
        width: 'auto',
        minWidth: anchorWidth ?? style?.minWidth,
      }}
    />
  );
};
