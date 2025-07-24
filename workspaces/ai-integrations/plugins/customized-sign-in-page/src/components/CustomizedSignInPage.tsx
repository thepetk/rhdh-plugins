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
import React from 'react';
import { SignInPage } from '@backstage/core-components';
import { oidcAuthApiRef } from '@backstage/core-plugin-api';

export const CustomSignInPage = () => (
  <SignInPage
    auto
    provider={{
      id: 'oidc',
      title: 'OIDC',
      message: 'Sign in using OIDC',
      apiRef: oidcAuthApiRef,
    }}
  >
    <div
      style={{
        backgroundColor: '#fff3cd',
        padding: '12px',
        border: '1px solid #ffeeba',
        marginBottom: '1rem',
      }}
    >
      <strong>Note:</strong> If you are signing in for the first time with RH
      SSO, you might need to try again after a few moments.
    </div>
  </SignInPage>
);
