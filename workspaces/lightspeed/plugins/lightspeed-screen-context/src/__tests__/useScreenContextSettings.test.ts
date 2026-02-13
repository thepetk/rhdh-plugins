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

import { createElement, ReactNode } from 'react';

import { StorageApi, storageApiRef } from '@backstage/core-plugin-api';
import { mockApis, TestApiProvider } from '@backstage/test-utils';

import { act, renderHook, waitFor } from '@testing-library/react';

import { useScreenContextSettings } from '../hooks/useScreenContextSettings';

describe('useScreenContextSettings', () => {
  const mockUser = 'user:default/john';
  const guestUser = 'user:default/guest';
  let mockStorageApi: StorageApi;

  const createWrapper = (storageApi: StorageApi) => {
    return ({ children }: { children: ReactNode }) =>
      createElement(TestApiProvider, {
        apis: [[storageApiRef, storageApi]],
        children,
      });
  };

  beforeEach(() => {
    mockStorageApi = mockApis.storage();
  });

  describe('initialization', () => {
    it('should initialize with screen context disabled when user is undefined', () => {
      const { result } = renderHook(() => useScreenContextSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isScreenContextEnabled).toBe(false);
    });

    it('should initialize with screen context disabled for a new user', () => {
      const { result } = renderHook(() => useScreenContextSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isScreenContextEnabled).toBe(false);
    });

    it('should initialize with defaults for guest user without loading from storage', () => {
      const { result } = renderHook(() => useScreenContextSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isScreenContextEnabled).toBe(false);
    });
  });

  describe('handleScreenContextToggle', () => {
    it('should toggle screen context enabled state', async () => {
      const { result } = renderHook(() => useScreenContextSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isScreenContextEnabled).toBe(false);

      act(() => {
        result.current.handleScreenContextToggle(true);
      });

      await waitFor(() => {
        expect(result.current.isScreenContextEnabled).toBe(true);
      });

      act(() => {
        result.current.handleScreenContextToggle(false);
      });

      await waitFor(() => {
        expect(result.current.isScreenContextEnabled).toBe(false);
      });
    });

    it('should persist toggle state to storage', async () => {
      const { result } = renderHook(() => useScreenContextSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleScreenContextToggle(true);
      });

      await waitFor(() => {
        const bucket = mockStorageApi.forBucket('lightspeed');
        const snapshot = bucket.snapshot<boolean>('screenContextEnabled');
        expect(snapshot.value).toBe(true);
      });
    });

    it('should not update if user is undefined', () => {
      const { result } = renderHook(() => useScreenContextSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleScreenContextToggle(true);
      });

      expect(result.current.isScreenContextEnabled).toBe(false);
    });

    it('should update local state but not persist for guest users', async () => {
      const { result } = renderHook(() => useScreenContextSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleScreenContextToggle(true);
      });

      await waitFor(() => {
        expect(result.current.isScreenContextEnabled).toBe(true);
      });

      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<boolean>('screenContextEnabled');
      expect(snapshot.value).toBeUndefined();
    });
  });

  describe('user change behavior', () => {
    it('should reset to defaults when user becomes undefined', async () => {
      const { result, rerender } = renderHook(
        ({ user }) => useScreenContextSettings(user),
        {
          wrapper: createWrapper(mockStorageApi),
          initialProps: { user: mockUser as string | undefined },
        },
      );

      act(() => {
        result.current.handleScreenContextToggle(true);
      });

      await waitFor(() => {
        expect(result.current.isScreenContextEnabled).toBe(true);
      });

      rerender({ user: undefined });

      await waitFor(() => {
        expect(result.current.isScreenContextEnabled).toBe(false);
      });
    });

    it('should reset to defaults when user changes to guest', async () => {
      const { result, rerender } = renderHook(
        ({ user }) => useScreenContextSettings(user),
        {
          wrapper: createWrapper(mockStorageApi),
          initialProps: { user: mockUser },
        },
      );

      act(() => {
        result.current.handleScreenContextToggle(true);
      });

      await waitFor(() => {
        expect(result.current.isScreenContextEnabled).toBe(true);
      });

      rerender({ user: guestUser });

      await waitFor(() => {
        expect(result.current.isScreenContextEnabled).toBe(false);
      });
    });
  });
});
