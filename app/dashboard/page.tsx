import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/auth";
import Navbar from "@/app/components/navbar";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Hola, {session.user?.name ?? "usuario"}
        </h1>
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
          Esta es tu área privada. Solo puedes verla si has iniciado sesión.
        </p>
      </div>
    </div>
  );
}
