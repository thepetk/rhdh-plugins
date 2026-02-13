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

import React, { useCallback, useMemo, useState } from 'react';
import {
  Content,
  Header,
  InfoCard,
  Page,
  Progress,
} from '@backstage/core-components';
import {
  configApiRef,
  discoveryApiRef,
  oauthRequestApiRef,
  SignInPageProps,
  useApi,
} from '@backstage/core-plugin-api';
import { UserIdentity } from '@backstage/core-components';
import { OAuth2 } from '@backstage/core-app-api';
import { Alert } from '@material-ui/lab';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  container: {
    padding: 0,
    listStyle: 'none',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '400px',
    margin: 0,
    padding: 0,
  },
  warningAlert: {
    width: '100%',
    borderRadius: 0,
  },
});

export const RHDHCustomizedSignInPage = (props: SignInPageProps) => {
  const { onSignInSuccess } = props;
  const classes = useStyles();
  const configApi = useApi(configApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const oauthRequestApi = useApi(oauthRequestApiRef);

  const oauth2 = useMemo(
    () =>
      OAuth2.create({
        configApi,
        discoveryApi,
        oauthRequestApi,
        provider: { id: 'oidc', title: 'Keycloak', icon: () => null },
        defaultScopes: ['openid', 'profile', 'email'],
      }),
    [configApi, discoveryApi, oauthRequestApi],
  );

  const [error, setError] = useState<Error>();
  const [showLoginPage, setShowLoginPage] = useState(false);

  const login = useCallback(
    async (options?: { showPopup?: boolean }) => {
      try {
        let identityResponse = await oauth2.getBackstageIdentity({
          optional: true,
        });
        if (!identityResponse && options?.showPopup) {
          setShowLoginPage(true);
          identityResponse = await oauth2.getBackstageIdentity({
            instantPopup: true,
          });
        }
        if (!identityResponse) {
          setShowLoginPage(true);
          return;
        }
        const profile = await oauth2.getProfile();
        onSignInSuccess(
          UserIdentity.create({
            identity: identityResponse.identity,
            profile,
            authApi: oauth2,
          }),
        );
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setShowLoginPage(true);
      }
    },
    [oauth2, onSignInSuccess],
  );

  React.useEffect(() => {
    login();
  }, [login]);

  if (!showLoginPage) {
    return <Progress />;
  }

  return (
    <>
      <Alert severity="info" className={classes.warningAlert}>
        If this is your first time logging in, you may see the error
        &quot;Failed to sign-in, unable to resolve user identity&quot;. Please
        wait a few minutes and try again since it will take some time for the
        registration to complete.
      </Alert>
      <Page themeId="home">
        <Header title={configApi.getString('app.title')} />
        <Content>
          <Grid
            container
            justifyContent="center"
            spacing={2}
            component="ul"
            classes={classes}
          >
            <Grid component="li" item classes={classes}>
              <InfoCard
                variant="fullHeight"
                title="Red Hat SSO"
                actions={
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => login({ showPopup: true })}
                  >
                    Sign in
                  </Button>
                }
              >
                <Typography variant="body1">
                  Sign in using Red Hat SSO
                </Typography>
                {error && error.name !== 'PopupRejectedError' && (
                  <Typography variant="body1" color="error">
                    {error.message}
                  </Typography>
                )}
              </InfoCard>
            </Grid>
          </Grid>
        </Content>
      </Page>
    </>
  );
};
