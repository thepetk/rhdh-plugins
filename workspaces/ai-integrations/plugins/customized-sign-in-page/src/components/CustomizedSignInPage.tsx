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
import { keycloakApiRef } from '../api';

export const CustomizedSignInPage = (props: any) => {
  return (
    <div>
      <div
        style={{
          backgroundColor: '#323232',
          color: '#f0c000',
          padding: '16px',
          border: '1px solid #f0c000',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '14px',
          fontFamily: 'inherit',
        }}
      >
        <strong style={{ color: '#f5c842' }}>⚠️ Note:</strong> If this is your
        first time logging in the rolling demo environment, you may see the
        error{' '}
        <em>
          "Failed to sign-in, unable to resolve user identity. Please verify
          that your catalog contains the expected User entities that would match
          your configured sign-in resolver."
        </em>
        . Please wait a few minutes and try again since it will take some time
        for the registration to complete.
      </div>
      <SignInPage
        {...props}
        auto
        providers={[
          {
            id: 'oidc',
            title: 'Red Hat SSO',
            message: 'Sign in using Red Hat SSO',
            apiRef: keycloakApiRef,
          },
        ]}
      />
    </div>
  );
};
