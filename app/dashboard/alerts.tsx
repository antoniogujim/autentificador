import { Package, CreditCard, BookOpen } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  SAMPLE_INVENTORY,
  DIAS_AVISO,
  diasRestantes,
  type InventoryItem,
  type InventoryCategory,
} from "@/app/lib/inventory";

const ICONOS: Record<InventoryCategory, typeof Package> = {
  equipo: Package,
  suscripcion: CreditCard,
  libro: BookOpen,
};

function mensaje(item: InventoryItem, dias: number): string {
  const esSuscripcion = item.categoria === "suscripcion";

  if (dias < 0) {
    const transcurridos = Math.abs(dias);
    const verbo = esSuscripcion ? "Se renovó" : "La garantía venció";
    return `${verbo} hace ${transcurridos} día${transcurridos === 1 ? "" : "s"}.`;
  }

  const verbo = esSuscripcion ? "Se renueva" : "La garantía vence";
  if (dias === 0) {
    return `${verbo} hoy.`;
  }
  return `${verbo} en ${dias} día${dias === 1 ? "" : "s"}.`;
}

export default function InventoryAlerts() {
  const avisos = SAMPLE_INVENTORY.filter(
    (item): item is InventoryItem & { fechaLimite: string } =>
      item.fechaLimite !== undefined
  )
    .map((item) => ({ item, dias: diasRestantes(item.fechaLimite) }))
    .filter(({ dias }) => dias <= DIAS_AVISO)
    .sort((a, b) => a.dias - b.dias);

  if (avisos.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2 text-left">
      <h2 className="text-sm font-medium text-muted-foreground">Avisos</h2>
      {avisos.map(({ item, dias }) => {
        const Icono = ICONOS[item.categoria];
        return (
          <Alert key={item.id} variant={dias <= 7 ? "destructive" : "default"}>
            <Icono />
            <AlertTitle>{item.nombre}</AlertTitle>
            <AlertDescription>{mensaje(item, dias)}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
