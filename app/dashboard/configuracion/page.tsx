import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/app/lib/auth";
import Navbar from "@/app/components/navbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DisplayNameForm from "../display-name-form";
import AlertDaysForm from "../alert-days-form";
import ClearInventoryButton from "../clear-inventory-button";
import ExportInventoryButton from "../export-inventory-button";
import ImportInventoryButton from "../import-inventory-button";
import { getDisplayName, getAlertDays } from "../actions";

const METODOS_LOGIN: Record<string, string> = {
  github: "GitHub",
  credentials: "Email y contraseña",
  "firebase-google": "Google",
};

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const displayName = await getDisplayName();
  const alertDays = await getAlertDays();
  const nombreMostrado =
    displayName || session.user?.name || session.user?.email || "usuario";
  const metodoLogin = session.user?.provider
    ? METODOS_LOGIN[session.user.provider] ?? session.user.provider
    : "—";

  return (
    <div className="flex flex-1 flex-col">
      <Navbar displayName={nombreMostrado} />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <div>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-4"
            )}
          >
            <ArrowLeft />
            Volver al dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Configuración
          </h1>
          <p className="text-muted-foreground">
            Gestiona los datos de tu cuenta.
          </p>
        </div>

        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div>
            <h2 className="text-lg font-medium text-foreground">
              Nombre visible
            </h2>
            <p className="text-sm text-muted-foreground">
              Este nombre se muestra en el dashboard y en la barra superior,
              en lugar de tu correo electrónico.
            </p>
          </div>
          <DisplayNameForm initialName={nombreMostrado} />
        </section>

        <section className="flex flex-col gap-1 rounded-lg border border-border p-4">
          <h2 className="text-lg font-medium text-foreground">Cuenta</h2>
          <p className="text-sm text-muted-foreground">
            Correo electrónico: {session.user?.email ?? "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            Método de inicio de sesión: {metodoLogin}
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div>
            <h2 className="text-lg font-medium text-foreground">Avisos</h2>
            <p className="text-sm text-muted-foreground">
              Días de antelación con los que el dashboard te avisa de
              garantías y renovaciones próximas a vencer.
            </p>
          </div>
          <AlertDaysForm initialDays={alertDays} />
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div>
            <h2 className="text-lg font-medium text-foreground">
              Copia de seguridad
            </h2>
            <p className="text-sm text-muted-foreground">
              Descarga una copia de tu inventario en formato JSON, o
              importa elementos desde un archivo exportado previamente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportInventoryButton />
            <ImportInventoryButton />
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4">
          <div>
            <h2 className="text-lg font-medium text-foreground">
              Inventario
            </h2>
            <p className="text-sm text-muted-foreground">
              Elimina todos los equipos, suscripciones y colecciones de tu
              inventario.
            </p>
          </div>
          <ClearInventoryButton />
        </section>
      </div>
    </div>
  );
}
