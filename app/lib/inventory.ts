export type InventoryCategory = "equipo" | "suscripcion" | "libro";

export interface InventoryItem {
  id: string;
  nombre: string;
  categoria: InventoryCategory;
  /** Fecha límite en formato ISO (YYYY-MM-DD): vencimiento de garantía o próxima renovación */
  fechaLimite?: string;
  notas?: string;
}

/** Número de días de antelación con los que se muestra un aviso */
export const DIAS_AVISO = 30;

/** Días que faltan hasta fechaLimite (negativo si ya ha pasado) */
export function diasRestantes(fechaLimite: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);
  const diffMs = limite.getTime() - hoy.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function isoInDays(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

/**
 * Datos de ejemplo para diseñar los avisos del dashboard.
 * Más adelante vendrán de Firestore, asociados al usuario autenticado.
 */
export const SAMPLE_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    nombre: "Disco duro externo Seagate",
    categoria: "equipo",
    fechaLimite: isoInDays(2),
    notas: "Garantía del fabricante",
  },
  {
    id: "2",
    nombre: 'Garantía monitor LG 27"',
    categoria: "equipo",
    fechaLimite: isoInDays(-3),
  },
  {
    id: "3",
    nombre: "Netflix",
    categoria: "suscripcion",
    fechaLimite: isoInDays(20),
  },
  {
    id: "4",
    nombre: "Spotify",
    categoria: "suscripcion",
    fechaLimite: isoInDays(45),
  },
  {
    id: "5",
    nombre: "Clean Code - Robert C. Martin",
    categoria: "libro",
  },
];
