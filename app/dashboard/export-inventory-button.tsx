"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInventoryItems } from "./actions";

export default function ExportInventoryButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleExport() {
    setError(null);
    startTransition(async () => {
      try {
        const items = await getInventoryItems();
        const blob = new Blob([JSON.stringify(items, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "inventario.json";
        link.click();
        URL.revokeObjectURL(url);
      } catch {
        setError("No se ha podido exportar el inventario.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={handleExport} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Download />}
        Descargar inventario (JSON)
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
