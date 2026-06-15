"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importInventoryItems } from "./actions";

export default function ImportInventoryButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const importados = await importInventoryItems(data);
        setSuccess(
          `Se ${importados === 1 ? "ha importado 1 elemento" : `han importado ${importados} elementos`}.`
        );
        router.refresh();
      } catch {
        setError(
          "No se ha podido importar el archivo. Comprueba que sea un JSON válido exportado desde esta app."
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Upload />}
        Importar inventario (JSON)
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-muted-foreground">{success}</p>}
    </div>
  );
}
