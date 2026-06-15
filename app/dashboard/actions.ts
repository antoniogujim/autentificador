"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { adminDb } from "@/app/lib/firebase-admin";
import { SAMPLE_INVENTORY, type InventoryItem } from "@/app/lib/inventory";

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
    const batch = adminDb.batch();
    for (const { id, ...data } of SAMPLE_INVENTORY) {
      batch.set(collection.doc(id), data);
    }
    await batch.commit();
    return SAMPLE_INVENTORY;
  }

  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as InventoryItem
  );
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
