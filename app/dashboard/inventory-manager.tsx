"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertAction } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type InventoryItem } from "@/app/lib/inventory";
import {
  addInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
} from "./actions";
import InventoryAlerts from "./alerts";
import InventoryForm from "./inventory-form";
import InventoryList from "./inventory-list";

const ERROR_GUARDAR =
  "No se ha podido guardar el elemento. Inténtalo de nuevo.";
const ERROR_ELIMINAR =
  "No se ha podido eliminar el elemento. Inténtalo de nuevo.";

interface InventoryManagerProps {
  initialItems: InventoryItem[];
  diasAviso: number;
}

export default function InventoryManager({
  initialItems,
  diasAviso,
}: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSave(item: InventoryItem) {
    setError(null);
    const anterior = items.find((i) => i.id === item.id);
    setEditingItem(null);

    if (!anterior) {
      const { nombre, categoria, fechaLimite, notas, coleccion } = item;
      setSaving(true);
      try {
        const creado = await addInventoryItem({
          nombre,
          categoria,
          fechaLimite,
          notas,
          coleccion,
        });
        setItems((prev) => [...prev, creado]);
      } catch {
        setError(ERROR_GUARDAR);
      } finally {
        setSaving(false);
      }
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    setSaving(true);
    try {
      await updateInventoryItem(item);
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? anterior : i)));
      setError(ERROR_GUARDAR);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return;
    const eliminado = items[index];

    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editingItem?.id === id) {
      setEditingItem(null);
    }

    setDeletingId(id);
    try {
      await deleteInventoryItem(id);
    } catch {
      setItems((prev) => {
        const copia = [...prev];
        copia.splice(index, 0, eliminado);
        return copia;
      });
      setError(ERROR_ELIMINAR);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
          <AlertAction>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Cerrar aviso"
              onClick={() => setError(null)}
            >
              <X />
            </Button>
          </AlertAction>
        </Alert>
      )}
      <InventoryAlerts items={items} diasAviso={diasAviso} />
      <InventoryForm
        key={editingItem?.id ?? "new"}
        editingItem={editingItem}
        saving={saving}
        onSave={handleSave}
        onCancel={() => setEditingItem(null)}
      />
      <InventoryList
        items={items}
        deletingId={deletingId}
        onEdit={setEditingItem}
        onDelete={handleDelete}
      />
    </div>
  );
}
