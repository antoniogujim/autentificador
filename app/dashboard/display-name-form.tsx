"use client";

import { useState, useTransition, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDisplayName } from "./actions";

interface DisplayNameFormProps {
  initialName: string;
}

export default function DisplayNameForm({
  initialName,
}: DisplayNameFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Editar nombre"
        onClick={() => setEditing(true)}
      >
        <Pencil />
      </Button>
    );
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const nombre = String(
      new FormData(event.currentTarget).get("displayName") ?? ""
    ).trim();

    if (!nombre) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        await updateDisplayName(nombre);
        setEditing(false);
        router.refresh();
      } catch {
        setError("No se ha podido guardar el nombre.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <Input
        name="displayName"
        defaultValue={initialName}
        maxLength={50}
        autoFocus
        disabled={pending}
        className="h-8 w-48"
        aria-label="Nombre"
        aria-invalid={!!error}
      />
      <Button
        type="submit"
        size="icon-sm"
        variant="ghost"
        aria-label="Guardar nombre"
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
