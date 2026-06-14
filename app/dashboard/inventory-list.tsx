import { Package, CreditCard, BookOpen } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  SAMPLE_INVENTORY,
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

export default function InventoryList() {
  return (
    <div className="flex flex-col gap-8">
      {CATEGORIAS.map(({ id, label, icon: Icon }) => {
        const items = SAMPLE_INVENTORY.filter((item) => item.categoria === id);
        if (items.length === 0) {
          return null;
        }

        return (
          <section key={id} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Icon className="size-5 text-primary" />
              {label}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const desc = descripcion(item);
                return (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle>{item.nombre}</CardTitle>
                      {desc && <CardDescription>{desc}</CardDescription>}
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
