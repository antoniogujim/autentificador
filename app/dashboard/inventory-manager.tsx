"use client";

import { useState } from "react";
import { type InventoryItem } from "@/app/lib/inventory";
import {
  addInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
} from "./actions";
import InventoryAlerts from "./alerts";
import InventoryForm from "./inventory-form";
import InventoryList from "./inventory-list";

interface InventoryManagerProps {
  initialItems: InventoryItem[];
}

export default function InventoryManager({
  initialItems,
}: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  async function handleSave(item: InventoryItem) {
    const esNuevo = !items.some((i) => i.id === item.id);
    setEditingItem(null);

    if (esNuevo) {
      const { nombre, categoria, fechaLimite, notas, coleccion } = item;
      const creado = await addInventoryItem({
        nombre,
        categoria,
        fechaLimite,
        notas,
        coleccion,
      });
      setItems((prev) => [...prev, creado]);
    } else {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      await updateInventoryItem(item);
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
    await deleteInventoryItem(id);
  }

  return (
    <div className="flex flex-col gap-8">
      <InventoryAlerts items={items} />
      <InventoryForm
        key={editingItem?.id ?? "new"}
        editingItem={editingItem}
        onSave={handleSave}
        onCancel={() => setEditingItem(null)}
      />
      <InventoryList
        items={items}
        onEdit={setEditingItem}
        onDelete={handleDelete}
      />
    </div>
  );
}
