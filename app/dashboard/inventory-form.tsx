"use client";

import { useId, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type InventoryCategory, type InventoryItem } from "@/app/lib/inventory";

const CATEGORIAS: { id: InventoryCategory; label: string }[] = [
  { id: "equipo", label: "Equipo" },
  { id: "suscripcion", label: "Suscripción" },
  { id: "libro", label: "Libro / colección" },
];

const FECHA_LABEL: Record<InventoryCategory, string> = {
  equipo: "Fecha de garantía (opcional)",
  suscripcion: "Próxima renovación (opcional)",
  libro: "Fecha límite (opcional)",
};

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

interface InventoryFormProps {
  editingItem: InventoryItem | null;
  onSave: (item: InventoryItem) => void;
  onCancel: () => void;
}

export default function InventoryForm({
  editingItem,
  onSave,
  onCancel,
}: InventoryFormProps) {
  const id = useId();
  const [categoria, setCategoria] = useState<InventoryCategory>(
    editingItem?.categoria ?? "equipo"
  );

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const nombre = String(data.get("nombre") ?? "").trim();
    if (!nombre) {
      return;
    }

    const fechaLimite = String(data.get("fechaLimite") ?? "");
    const notas = String(data.get("notas") ?? "").trim();
    const coleccion = String(data.get("coleccion") ?? "").trim();

    onSave({
      id: editingItem?.id ?? crypto.randomUUID(),
      nombre,
      categoria,
      fechaLimite: categoria !== "libro" && fechaLimite ? fechaLimite : undefined,
      notas: notas || undefined,
      coleccion: categoria === "libro" && coleccion ? coleccion : undefined,
    });

    if (!editingItem) {
      form.reset();
      setCategoria("equipo");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <h2 className="text-lg font-medium text-foreground">
        {editingItem ? "Editar elemento" : "Añadir elemento"}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-nombre`}>Nombre</Label>
          <Input
            id={`${id}-nombre`}
            name="nombre"
            defaultValue={editingItem?.nombre}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-categoria`}>Categoría</Label>
          <select
            id={`${id}-categoria`}
            value={categoria}
            onChange={(event) =>
              setCategoria(event.target.value as InventoryCategory)
            }
            className={selectClassName}
          >
            {CATEGORIAS.map(({ id: catId, label }) => (
              <option key={catId} value={catId}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {categoria === "libro" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-coleccion`}>Colección (opcional)</Label>
            <Input
              id={`${id}-coleccion`}
              name="coleccion"
              placeholder="p.ej. una saga, un autor, un género..."
              defaultValue={editingItem?.coleccion}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-fecha`}>{FECHA_LABEL[categoria]}</Label>
            <Input
              id={`${id}-fecha`}
              name="fechaLimite"
              type="date"
              defaultValue={editingItem?.fechaLimite}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-notas`}>Notas (opcional)</Label>
          <Input
            id={`${id}-notas`}
            name="notas"
            defaultValue={editingItem?.notas}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">
          {editingItem ? "Guardar cambios" : "Añadir"}
        </Button>
        {editingItem && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
