import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/auth";
import Navbar from "@/app/components/navbar";
import InventoryManager from "./inventory-manager";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Hola, {session.user?.name ?? "usuario"}
          </h1>
          <p className="text-muted-foreground">
            Este es tu inventario personal.
          </p>
        </div>

        <InventoryManager />
      </div>
    </div>
  );
}
