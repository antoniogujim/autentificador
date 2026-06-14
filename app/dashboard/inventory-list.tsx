import { Package, CreditCard, BookOpen, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  type InventoryCategory,
  type InventoryItem,
} from "@/app/lib/inventory";

const CATEGORIAS: {
  id: InventoryCategory;
  label: string;
  icon: typeof Package;
}[] = [
  { id: "equipo", label: "Equipos", icon: Package },
  { id: "suscripcion", label: "Suscripciones", icon: CreditCard },
  { id: "libro", label: "Libros y colecciones", icon: BookOpen },
];

const SIN_COLECCION = "Sin colección";

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function descripcion(item: InventoryItem): string | undefined {
  if (!item.fechaLimite) {
    return item.notas;
  }
  const fecha = formatFecha(item.fechaLimite);
  return item.categoria === "suscripcion"
    ? `Próxima renovación: ${fecha}`
    : `Garantía hasta ${fecha}`;
}

function agruparPorColeccion(
  items: InventoryItem[]
): [string, InventoryItem[]][] {
  const grupos = new Map<string, InventoryItem[]>();
  for (const item of items) {
    const grupo = item.coleccion?.trim() || SIN_COLECCION;
    const lista = grupos.get(grupo) ?? [];
    lista.push(item);
    grupos.set(grupo, lista);
  }
  return Array.from(grupos.entries()).sort(([a], [b]) => {
    if (a === SIN_COLECCION) return 1;
    if (b === SIN_COLECCION) return -1;
    return a.localeCompare(b);
  });
}

interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export default function InventoryList({
  items,
  onEdit,
  onDelete,
}: InventoryListProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        Todavía no has añadido ningún elemento.
      </p>
    );
  }

  function renderCard(item: InventoryItem) {
    const desc = descripcion(item);
    return (
      <Card
        key={item.id}
        className="transition-shadow hover:bg-primary/10 hover:shadow-md hover:shadow-primary/20"
      >
        <CardHeader>
          <CardTitle>{item.nombre}</CardTitle>
          {desc && <CardDescription>{desc}</CardDescription>}
          <CardAction className="flex gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Editar"
              onClick={() => onEdit(item)}
            >
              <Pencil />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Eliminar"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 />
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {CATEGORIAS.map(({ id, label, icon: Icon }) => {
        const categoryItems = items.filter((item) => item.categoria === id);
        if (categoryItems.length === 0) {
          return null;
        }

        return (
          <section key={id} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Icon className="size-5 text-primary" />
              {label}
            </h2>

            {id === "libro" ? (
              <div className="flex flex-col gap-4">
                {agruparPorColeccion(categoryItems).map(
                  ([grupo, grupoItems]) => (
                    <div key={grupo} className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {grupo}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {grupoItems.map(renderCard)}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map(renderCard)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
