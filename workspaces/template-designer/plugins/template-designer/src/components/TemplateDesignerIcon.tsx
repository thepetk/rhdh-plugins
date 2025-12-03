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
import SvgIcon, { SvgIconProps } from '@material-ui/core/SvgIcon';

export const TemplateDesignerIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 96 96"
    stroke="currentColor"
    // Explicitly clear the default Material-UI fill so the icon renders as an outline in Backstage.
    style={{ ...props.style, fill: 'none' }}
    strokeWidth={3.4}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x={6} y={6} width={84} height={84} rx={22} fill="none" />
    <polygon points="28,18 42,32 28,46 14,32" fill="none" />
    <rect x={58} y={24} width={24} height={16} rx={3} fill="none" />
    <rect x={16} y={60} width={24} height={16} rx={3} fill="none" />
    <rect x={58} y={60} width={24} height={16} rx={3} fill="none" />
    <path d="M42 32 H58" />
    <path d="M58 32 l-4 -3.5 M58 32 l-4 3.5" />
    <path d="M28 46 V60" />
    <path d="M28 60 l-4 -4 M28 60 l4 -4" />
    <path d="M40 68 H58" />
    <path d="M58 68 l-4 -3.5 M58 68 l-4 3.5" />
    <path d="M70 40 V60" />
    <path d="M70 60 l-4 -4 M70 60 l4 -4" />
  </SvgIcon>
);

export default TemplateDesignerIcon;
