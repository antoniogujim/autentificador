"use client";

import { useState, useTransition, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAlertDays } from "./actions";

interface AlertDaysFormProps {
  initialDays: number;
}

export default function AlertDaysForm({ initialDays }: AlertDaysFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {initialDays} día{initialDays === 1 ? "" : "s"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Editar días de aviso"
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
      </div>
    );
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(
      new FormData(event.currentTarget).get("alertDays") ?? ""
    );

    if (!Number.isInteger(value) || value < 1 || value > 365) {
      setError("Introduce un número entre 1 y 365.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        await updateAlertDays(value);
        setEditing(false);
        router.refresh();
      } catch {
        setError("No se ha podido guardar el valor.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <Input
        type="number"
        name="alertDays"
        defaultValue={initialDays}
        min={1}
        max={365}
        autoFocus
        disabled={pending}
        className="h-8 w-24"
        aria-label="Días de aviso"
        aria-invalid={!!error}
      />
      <Button
        type="submit"
        size="icon-sm"
        variant="ghost"
        aria-label="Guardar"
        disabled={pending}
      >
        <Check />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Cancelar"
        disabled={pending}
        onClick={() => setEditing(false)}
      >
        <X />
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
