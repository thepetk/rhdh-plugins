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

import { useCallback, useEffect, useState } from 'react';

import { storageApiRef, useApi } from '@backstage/core-plugin-api';

import { UseScreenContextSettingsReturn } from './types';
import { isGuestUser } from './user-utils';

const BUCKET_NAME = 'lightspeed';
const SCREEN_CONTEXT_ENABLED_KEY = 'screenContextEnabled';

/**
 * Hook to manage screen context settings with persistence using Backstage StorageApi.
 * Settings are automatically scoped per-user by the StorageApi backend when using
 * database persistence. For guest users, settings are only kept in local state
 * and not persisted.
 *
 * @param user - The user entity ref (e.g., "user:default/john")
 * @returns Object containing screen context state and toggle function
 */
export const useScreenContextSettings = (
  user: string | undefined,
): UseScreenContextSettingsReturn => {
  const storageApi = useApi(storageApiRef);
  const bucket = storageApi.forBucket(BUCKET_NAME);

  const [isScreenContextEnabled, setIsScreenContextEnabled] = useState(false);

  const shouldPersist = !isGuestUser(user);

  useEffect(() => {
    if (!user) {
      setIsScreenContextEnabled(false);
      return undefined;
    }

    if (isGuestUser(user)) {
      setIsScreenContextEnabled(false);
      return undefined;
    }

    try {
      const snapshot = bucket.snapshot<boolean>(SCREEN_CONTEXT_ENABLED_KEY);
      setIsScreenContextEnabled(snapshot.value ?? false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Error reading screen context settings from storage:',
        error,
      );
    }

    const subscription = bucket
      .observe$<boolean>(SCREEN_CONTEXT_ENABLED_KEY)
      .subscribe({
        next: snapshot => {
          setIsScreenContextEnabled(snapshot.value ?? false);
        },
        error: error => {
          // eslint-disable-next-line no-console
          console.error('Error observing screenContextEnabled:', error);
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [bucket, user]);

  const handleScreenContextToggle = useCallback(
    (enabled: boolean) => {
      if (!user) return;

      setIsScreenContextEnabled(enabled);

      if (shouldPersist) {
        try {
          bucket.set(SCREEN_CONTEXT_ENABLED_KEY, enabled);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error saving screen context toggle state:', error);
        }
      }
    },
    [bucket, user, shouldPersist],
  );

  return {
    isScreenContextEnabled,
    handleScreenContextToggle,
  };
};
