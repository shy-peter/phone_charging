import type { RegisteredDevice } from '../components/DeviceRegistration';

const DEFAULT_BASE = 'http://localhost:4000';

export function getLocalApiBaseUrl() {
  const fromEnv = (import.meta as any).env?.VITE_LOCAL_API_BASE_URL as string | undefined;
  return (fromEnv || DEFAULT_BASE).replace(/\/+$/, '');
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function serializeDevice(device: RegisteredDevice) {
  return {
    ...device,
    registeredAt: device.registeredAt.toISOString(),
    retrievedAt: device.retrievedAt ? device.retrievedAt.toISOString() : null,
  };
}

function parseDevice(row: any): RegisteredDevice {
  return {
    ...row,
    registeredAt: row.registeredAt ? new Date(row.registeredAt) : new Date(),
    retrievedAt: row.retrievedAt ? new Date(row.retrievedAt) : undefined,
  };
}

export async function localApiHealthCheck(baseUrl = getLocalApiBaseUrl()) {
  return jsonFetch<{ ok: boolean }>(`${baseUrl}/api/health`);
}

export async function localApiListDevices(baseUrl = getLocalApiBaseUrl()) {
  const data = await jsonFetch<{ devices: any[] }>(`${baseUrl}/api/devices`);
  return data.devices.map(parseDevice);
}

export async function localApiUpsertDevice(device: RegisteredDevice, baseUrl = getLocalApiBaseUrl()) {
  return jsonFetch<{ ok: boolean }>(`${baseUrl}/api/devices/upsert`, {
    method: 'POST',
    body: JSON.stringify({ device: serializeDevice(device) }),
  });
}

export async function localApiPatchDevice(id: string, patch: Record<string, any>, baseUrl = getLocalApiBaseUrl()) {
  return jsonFetch<{ ok: boolean }>(`${baseUrl}/api/devices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ patch }),
  });
}

