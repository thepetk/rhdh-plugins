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

/**
 * A DOM context attachment ready to be sent via the existing attachment mechanism.
 * Contains a structured text representation of the current page extracted from the DOM.
 * Maps directly to the Attachment type in the lightspeed plugin.
 */
export interface ScreenContextAttachment {
  attachment_type: 'api object';
  content_type: 'text/plain';
  content: string;
}

/**
 * Options for controlling the DOM context extraction behavior.
 */
export interface CaptureOptions {
  /** CSS selector for elements to exclude from extraction */
  ignoreSelector?: string;
  /** Maximum DOM traversal depth (default: 30) */
  maxDepth?: number;
  /** Whether to include hidden/invisible elements (default: false) */
  includeHidden?: boolean;
}

/**
 * Return type of the useScreenCapture hook.
 */
export interface UseScreenCaptureReturn {
  /** Extract DOM context and return it as a ScreenContextAttachment. Returns null on failure. */
  captureContext: () => Promise<ScreenContextAttachment | null>;
  /** Whether a capture is currently in progress */
  isCapturing: boolean;
  /** Last capture error, if any */
  captureError: string | null;
}

/**
 * Options for the useScreenCaptureBuffer hook.
 */
export interface UseScreenCaptureBufferOptions extends CaptureOptions {
  /** Whether background capture is enabled */
  enabled: boolean;
  /** Interval in milliseconds between captures (default: 30000) */
  intervalMs?: number;
  /** Maximum number of snapshots to keep in the buffer (default: 5) */
  maxSnapshots?: number;
}

/**
 * Return type of the useScreenCaptureBuffer hook.
 */
export interface UseScreenCaptureBufferReturn {
  /** Rolling buffer of captured DOM snapshots (most recent last) */
  snapshots: ScreenContextAttachment[];
  /** Whether a capture is currently in progress */
  isCapturing: boolean;
  /** Last capture error, if any */
  captureError: string | null;
}

/**
 * Return type of the useScreenContextSettings hook.
 */
export interface UseScreenContextSettingsReturn {
  /** Whether screen context sharing is enabled */
  isScreenContextEnabled: boolean;
  /** Toggle screen context sharing on/off */
  handleScreenContextToggle: (enabled: boolean) => void;
}
