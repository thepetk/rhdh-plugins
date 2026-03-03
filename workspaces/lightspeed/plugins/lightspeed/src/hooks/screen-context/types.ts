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
 * A screenshot attachment ready to be sent via the existing attachment mechanism.
 * Maps directly to the Attachment type in the lightspeed plugin.
 */
export interface ScreenContextAttachment {
  attachment_type: 'screen_context';
  content_type: 'image/png';
  content: string;
}

/**
 * A React component tree attachment serialised as JSON.
 */
export interface UIContextAttachment {
  attachment_type: 'ui_context';
  content_type: 'application/json';
  content: string; // base64-encoded JSON
}

/**
 * Options for controlling the screenshot capture behavior.
 */
export interface CaptureOptions {
  /** Scale factor for the rendered canvas (default: 0.5 for performance) */
  scale?: number;
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1080) */
  maxHeight?: number;
  /** Whether to enable html2canvas logging (default: false) */
  logging?: boolean;
  /** CSS selector for elements to exclude from the screenshot */
  ignoreSelector?: string;
}

/**
 * Return type of the useScreenCapture hook.
 */
export interface UseScreenCaptureReturn {
  /** Capture a screenshot and return it as a ScreenContextAttachment. Returns null on failure. */
  captureScreenshot: () => Promise<ScreenContextAttachment | null>;
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
  /** Maximum number of screenshots to keep in the buffer (default: 5) */
  maxScreenshots?: number;
}

/**
 * Return type of the useScreenCaptureBuffer hook.
 */
export interface UseScreenCaptureBufferReturn {
  /** Rolling buffer of captured screenshots (most recent last) */
  screenshots: ScreenContextAttachment[];
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
