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
import type {
  KagentiAgent,
  KagentiAgentCard,
  KagentiDashboards,
  KagentiNamespace,
  KagentiRouteStatus,
} from './types';

/**
 * Normalizes a Kagenti API response to an array.
 * Handles plain arrays, { namespaces: [] }, { agents: [] }, { items: [] }, etc.
 */
function toArray<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    for (const key of keys) {
      const candidate = (data as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }
  }
  return [];
}

/**
 * fetchOAuthToken obtains a Bearer token via OAuth2 Client Credentials Grant
 */
export async function fetchOAuthToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to obtain OAuth token from ${tokenUrl}: ${res.statusText}`,
    );
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`OAuth token response missing access_token`);
  }
  return data.access_token as string;
}

/**
 * fetchKagentiNamespaces retrieves the list of enabled Kagenti namespaces
 */
export async function fetchKagentiNamespaces(
  baseUrl: string,
  token: string,
): Promise<KagentiNamespace[]> {
  const res = await fetch(`${baseUrl}/api/v1/namespaces`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Kagenti namespaces: ${res.statusText}`);
  }

  const data = await res.json();
  const items = toArray<string | KagentiNamespace>(data, [
    'namespaces',
    'items',
  ]);
  return items.map(item => (typeof item === 'string' ? { name: item } : item));
}

/**
 * fetchKagentiAgents retrieves the list of agents, optionally filtered by namespace
 */
export async function fetchKagentiAgents(
  baseUrl: string,
  token: string,
  namespaces?: string[],
): Promise<KagentiAgent[]> {
  const url = new URL(`${baseUrl}/api/v1/agents`);
  if (namespaces && namespaces.length > 0) {
    namespaces.forEach(ns => url.searchParams.append('namespace', ns));
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Kagenti agents: ${res.statusText}`);
  }

  const data = await res.json();
  return toArray<KagentiAgent>(data, ['agents', 'items']);
}

/**
 * fetchKagentiAgentDetail retrieves full metadata for a single agent
 */
export async function fetchKagentiAgentDetail(
  baseUrl: string,
  token: string,
  namespace: string,
  name: string,
): Promise<KagentiAgent> {
  const res = await fetch(`${baseUrl}/api/v1/agents/${namespace}/${name}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Kagenti agent detail for ${namespace}/${name}: ${res.statusText}`,
    );
  }

  return res.json();
}

/**
 * fetchKagentiAgentCard retrieves the A2A agent card (skills, version, streaming)
 */
export async function fetchKagentiAgentCard(
  baseUrl: string,
  token: string,
  namespace: string,
  name: string,
): Promise<KagentiAgentCard> {
  const res = await fetch(
    `${baseUrl}/api/v1/chat/${namespace}/${name}/agent-card`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch agent card for ${namespace}/${name}: ${res.statusText}`,
    );
  }

  return res.json();
}

/**
 * fetchKagentiRouteStatus retrieves the external route URL for an agent
 */
export async function fetchKagentiRouteStatus(
  baseUrl: string,
  token: string,
  namespace: string,
  name: string,
): Promise<KagentiRouteStatus> {
  const res = await fetch(
    `${baseUrl}/api/v1/agents/${namespace}/${name}/route-status`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch route status for ${namespace}/${name}: ${res.statusText}`,
    );
  }

  return res.json();
}

/**
 * fetchKagentiDashboards retrieves observability dashboard URLs
 */
export async function fetchKagentiDashboards(
  baseUrl: string,
  token: string,
): Promise<KagentiDashboards> {
  const res = await fetch(`${baseUrl}/api/v1/config/dashboards`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Kagenti dashboards: ${res.statusText}`);
  }

  return res.json();
}
