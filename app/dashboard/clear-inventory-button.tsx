"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { clearInventory } from "./actions";

export default function ClearInventoryButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await clearInventory();
        router.refresh();
      } catch {
        setError("No se ha podido vaciar el inventario.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="destructive" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Vaciar inventario
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Vaciar todo el inventario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos los equipos, suscripciones y colecciones.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              Vaciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
