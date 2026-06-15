"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { adminDb } from "@/app/lib/firebase-admin";
import {
  DIAS_AVISO,
  SAMPLE_INVENTORY,
  isInventoryItemInput,
  type InventoryItem,
} from "@/app/lib/inventory";

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }
  return session.user.id;
}

function userDoc(userId: string) {
  return adminDb.collection("users").doc(userId);
}

function inventoryCollection(userId: string) {
  return userDoc(userId).collection("inventory");
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const userId = await requireUserId();
  const collection = inventoryCollection(userId);
  const snapshot = await collection.get();

  if (snapshot.empty) {
    const userSnapshot = await userDoc(userId).get();
    if (!userSnapshot.data()?.seeded) {
      const batch = adminDb.batch();
      for (const { id, ...data } of SAMPLE_INVENTORY) {
        batch.set(collection.doc(id), data);
      }
      batch.set(userDoc(userId), { seeded: true }, { merge: true });
      await batch.commit();
      return SAMPLE_INVENTORY;
    }
  }

  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as InventoryItem
  );
}

export async function importInventoryItems(items: unknown): Promise<number> {
  const userId = await requireUserId();

  if (!Array.isArray(items)) {
    throw new Error("El archivo no tiene el formato esperado");
  }

  const validos = items.filter(isInventoryItemInput);
  if (validos.length === 0) {
    throw new Error("El archivo no contiene elementos válidos");
  }

  const collection = inventoryCollection(userId);
  const batch = adminDb.batch();
  for (const { nombre, categoria, fechaLimite, notas, coleccion } of validos) {
    const data: Record<string, unknown> = { nombre, categoria };
    if (fechaLimite !== undefined) data.fechaLimite = fechaLimite;
    if (notas !== undefined) data.notas = notas;
    if (coleccion !== undefined) data.coleccion = coleccion;
    batch.set(collection.doc(), data);
  }
  batch.set(userDoc(userId), { seeded: true }, { merge: true });
  await batch.commit();

  return validos.length;
}

export async function clearInventory(): Promise<void> {
  const userId = await requireUserId();
  const collection = inventoryCollection(userId);
  const snapshot = await collection.get();

  const batch = adminDb.batch();
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }
  batch.set(userDoc(userId), { seeded: true }, { merge: true });
  await batch.commit();
}

export async function addInventoryItem(
  item: Omit<InventoryItem, "id">
): Promise<InventoryItem> {
  const userId = await requireUserId();
  const ref = await inventoryCollection(userId).add(item);
  return { id: ref.id, ...item };
}

export async function updateInventoryItem(item: InventoryItem): Promise<void> {
  const userId = await requireUserId();
  const { id, ...data } = item;
  await inventoryCollection(userId).doc(id).set(data);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const userId = await requireUserId();
  await inventoryCollection(userId).doc(id).delete();
}

export async function getDisplayName(): Promise<string | null> {
  const userId = await requireUserId();
  const snapshot = await userDoc(userId).get();
  const displayName = snapshot.data()?.displayName;
  return typeof displayName === "string" ? displayName : null;
}

export async function updateDisplayName(name: string): Promise<void> {
  const userId = await requireUserId();
  const trimmed = name.trim().slice(0, 50);
  if (!trimmed) {
    throw new Error("El nombre no puede estar vacío");
  }
  await userDoc(userId).set({ displayName: trimmed }, { merge: true });
}

export async function getAlertDays(): Promise<number> {
  const userId = await requireUserId();
  const snapshot = await userDoc(userId).get();
  const alertDays = snapshot.data()?.alertDays;
  return typeof alertDays === "number" ? alertDays : DIAS_AVISO;
}

export async function updateAlertDays(days: number): Promise<void> {
  const userId = await requireUserId();
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("El número de días debe estar entre 1 y 365");
  }
  await userDoc(userId).set({ alertDays: days }, { merge: true });
}
