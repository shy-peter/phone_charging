import { Client, Databases, ID, Query } from 'appwrite';
import type { RegisteredDevice } from '../components/DeviceRegistration';
import type { PowerBank, PowerBankRental } from '../components/RentPower';

function getEnv(name: string): string | undefined {
  return (import.meta as any).env?.[name] as string | undefined;
}

const endpointRaw = (getEnv('VITE_APPWRITE_ENDPOINT') || '').trim().replace(/\/+$/, '');
const endpoint = endpointRaw.endsWith('/v1') ? endpointRaw : `${endpointRaw}/v1`;
const projectId = (getEnv('VITE_APPWRITE_PROJECT_ID') || '').trim();
const databaseId = (getEnv('VITE_APPWRITE_DATABASE_ID') || '').trim();
const devicesCollectionId = (getEnv('VITE_APPWRITE_DEVICES_COLLECTION_ID') || '').trim();
const agentsCollectionId = (getEnv('VITE_APPWRITE_AGENTS_COLLECTION_ID') || '').trim();
const agentInvitesCollectionId = (getEnv('VITE_APPWRITE_AGENT_INVITES_COLLECTION_ID') || '').trim();
const powerBanksCollectionId = (getEnv('VITE_APPWRITE_POWERBANKS_COLLECTION_ID') || '').trim();
const rentalsCollectionId = (getEnv('VITE_APPWRITE_RENTALS_COLLECTION_ID') || '').trim();

export const appwriteEnabled =
  !!endpointRaw && !!projectId && !!databaseId && !!devicesCollectionId;

export const appwriteAgentsEnabled =
  !!endpointRaw && !!projectId && !!databaseId && !!agentsCollectionId && !!agentInvitesCollectionId;

export const appwritePowerBanksEnabled =
  !!endpointRaw && !!projectId && !!databaseId && !!powerBanksCollectionId;

export const appwriteRentalsEnabled =
  !!endpointRaw && !!projectId && !!databaseId && !!rentalsCollectionId;

function createDatabases() {
  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  return new Databases(client);
}

function toPayloadDoc(payload: unknown) {
  const safeStr = (value: unknown, max: number) => {
    if (typeof value !== 'string') return value ?? null;
    return value.slice(0, max);
  };

  const str = JSON.stringify(payload);
  return {
    payload: str.length > 1900 ? JSON.stringify({ value: safeStr(str, 1900) }) : str,
  };
}

function fromPayloadDoc(doc: any): any {
  const payloadRaw = typeof doc?.payload === 'string' ? doc.payload : '';
  let payload: any = {};
  try {
    payload = payloadRaw ? JSON.parse(payloadRaw) : {};
  } catch {
    payload = {};
  }
  const merged = { ...payload, ...doc };
  return {
    ...merged,
    id: merged.id || doc.$id,
  };
}

function toDoc(device: RegisteredDevice) {
  const safeStr = (value: unknown, max: number) => {
    if (typeof value !== 'string') return value ?? null;
    return value.slice(0, max);
  };

  const payload = {
    id: safeStr(device.id, 36),
    registrationId: safeStr(device.registrationId, 80),
    username: safeStr(device.username, 80),
    deviceName: safeStr(device.deviceName, 120),
    deviceType: safeStr(device.deviceType, 40),
    price: device.price,
    pickupDate: safeStr(device.pickupDate, 40),
    registeredAt: device.registeredAt.toISOString(),
    registeredAtTime: safeStr(device.registeredAtTime, 40),
    retrievedAt: device.retrievedAt ? device.retrievedAt.toISOString() : null,
    retrievedAtTime: safeStr(device.retrievedAtTime, 40),
    registeredBy: safeStr(device.registeredBy, 80),
    releasedBy: safeStr(device.releasedBy, 80),
    releaseAuthMethod: safeStr(device.releaseAuthMethod, 20),
    retrievalPin: safeStr(device.retrievalPin, 10),
    registrationMethod: safeStr(device.registrationMethod, 40),
    status: device.status,
    paymentStatus: device.paymentStatus,
    slotNumber: device.slotNumber,
    qrData: safeStr(device.qrData, 140),
    fingerprintId: safeStr(device.fingerprintId, 140),
  };

  const payloadStr = JSON.stringify(payload);

  return {
    qrData: device.qrData || null,
    status: device.status,
    paymentStatus: device.paymentStatus,
    slotNumber: device.slotNumber,
    payload:
      payloadStr.length > 1900
        ? JSON.stringify({ ...payload, fingerprintId: null, pickupDate: null, retrievedAtTime: null })
        : payloadStr,
  };
}

function fromDoc(doc: any): RegisteredDevice {
  const payloadRaw = typeof doc?.payload === 'string' ? doc.payload : '';
  let payload: any = {};
  try {
    payload = payloadRaw ? JSON.parse(payloadRaw) : {};
  } catch {
    payload = {};
  }

  const merged = { ...payload, ...doc };

  return {
    ...merged,
    id: merged.id || doc.$id,
    registeredAt: merged.registeredAt ? new Date(merged.registeredAt) : new Date(),
    retrievedAt: merged.retrievedAt ? new Date(merged.retrievedAt) : undefined,
    photoUrl: merged.photoUrl || null,
  };
}

export async function appwriteListDevices(): Promise<RegisteredDevice[]> {
  const db = createDatabases();
  const res = await db.listDocuments(databaseId, devicesCollectionId, [
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ]);
  return (res.documents || []).map(fromDoc);
}

export async function appwriteListAgents(): Promise<any[]> {
  if (!appwriteAgentsEnabled) return [];
  const db = createDatabases();
  const res = await db.listDocuments(databaseId, agentsCollectionId, [
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ]);
  return (res.documents || []).map(fromPayloadDoc);
}

export async function appwriteCreateAgent(agent: any) {
  if (!appwriteAgentsEnabled) return;
  const db = createDatabases();
  await db.createDocument(databaseId, agentsCollectionId, ID.unique(), toPayloadDoc(agent));
}

export async function appwriteDeleteAgent(id: string) {
  if (!appwriteAgentsEnabled) return;
  const db = createDatabases();
  await db.deleteDocument(databaseId, agentsCollectionId, id);
}

export async function appwriteListAgentInvites(): Promise<any[]> {
  if (!appwriteAgentsEnabled) return [];
  const db = createDatabases();
  const res = await db.listDocuments(databaseId, agentInvitesCollectionId, [
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ]);
  return (res.documents || []).map(fromPayloadDoc);
}

export async function appwriteCreateAgentInvite(invite: any) {
  if (!appwriteAgentsEnabled) return;
  const db = createDatabases();
  await db.createDocument(databaseId, agentInvitesCollectionId, ID.unique(), toPayloadDoc(invite));
}

export async function appwriteUpdateAgentInvite(id: string, invite: any) {
  if (!appwriteAgentsEnabled) return;
  const db = createDatabases();
  await db.updateDocument(databaseId, agentInvitesCollectionId, id, toPayloadDoc(invite));
}

export async function appwriteCreateDevice(device: RegisteredDevice) {
  const db = createDatabases();
  const docId = (device.id || ID.unique()).toString();
  await db.createDocument(databaseId, devicesCollectionId, docId, toDoc(device));
}

export async function appwriteUpdateDevice(id: string, patch: Partial<RegisteredDevice>) {
  const db = createDatabases();
  const currentDoc = await db.getDocument(databaseId, devicesCollectionId, id);
  const current = fromDoc(currentDoc);
  const next: RegisteredDevice = { ...current, ...(patch as any) };
  await db.updateDocument(databaseId, devicesCollectionId, id, toDoc(next));
}

export async function appwriteUpsertDevice(device: RegisteredDevice) {
  try {
    await appwriteCreateDevice(device);
  } catch (e: any) {
    if (e?.code === 409 || e?.type === 'document_already_exists') {
      await appwriteUpdateDevice(device.id, device);
      return;
    }
    throw e;
  }
}

export async function appwriteFindByQr(qrData: string): Promise<RegisteredDevice | null> {
  const db = createDatabases();
  const res = await db.listDocuments(databaseId, devicesCollectionId, [
    Query.equal('qrData', qrData),
    Query.limit(1),
  ]);
  const first = res.documents?.[0];
  return first ? fromDoc(first) : null;
}

export async function appwriteListPowerBanks(): Promise<PowerBank[]> {
  if (!appwritePowerBanksEnabled) return [];
  const db = createDatabases();
  const res = await db.listDocuments(databaseId, powerBanksCollectionId, [
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ]);
  return (res.documents || []).map((d: any) => fromPayloadDoc(d)) as PowerBank[];
}

export async function appwriteUpsertPowerBank(powerBank: PowerBank) {
  if (!appwritePowerBanksEnabled) return;
  const db = createDatabases();
  const docId = (powerBank.id || ID.unique()).toString();
  try {
    await db.createDocument(databaseId, powerBanksCollectionId, docId, toPayloadDoc({ ...powerBank, id: docId }));
  } catch (e: any) {
    if (e?.code === 409 || e?.type === 'document_already_exists') {
      await db.updateDocument(databaseId, powerBanksCollectionId, docId, toPayloadDoc({ ...powerBank, id: docId }));
      return;
    }
    throw e;
  }
}

export async function appwriteListRentals(): Promise<PowerBankRental[]> {
  if (!appwriteRentalsEnabled) return [];
  const db = createDatabases();
  const res = await db.listDocuments(databaseId, rentalsCollectionId, [
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ]);
  return (res.documents || []).map((d: any) => fromPayloadDoc(d)) as PowerBankRental[];
}

export async function appwriteUpsertRental(rental: PowerBankRental) {
  if (!appwriteRentalsEnabled) return;
  const db = createDatabases();
  const docId = (rental.id || ID.unique()).toString();
  try {
    await db.createDocument(databaseId, rentalsCollectionId, docId, toPayloadDoc({ ...rental, id: docId }));
  } catch (e: any) {
    if (e?.code === 409 || e?.type === 'document_already_exists') {
      await db.updateDocument(databaseId, rentalsCollectionId, docId, toPayloadDoc({ ...rental, id: docId }));
      return;
    }
    throw e;
  }
}
