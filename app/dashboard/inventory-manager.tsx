"use client";

import { useState } from "react";
import { SAMPLE_INVENTORY, type InventoryItem } from "@/app/lib/inventory";
import InventoryAlerts from "./alerts";
import InventoryForm from "./inventory-form";
import InventoryList from "./inventory-list";

export default function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>(SAMPLE_INVENTORY);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  function handleSave(item: InventoryItem) {
    setItems((prev) => {
      const existe = prev.some((i) => i.id === item.id);
      if (existe) {
        return prev.map((i) => (i.id === item.id ? item : i));
      }
      return [...prev, item];
    });
    setEditingItem(null);
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
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
