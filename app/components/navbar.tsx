"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/app/components/theme-toggle";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  const initial =
    user?.name?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    "?";

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-3">
      <span className="text-lg font-semibold tracking-tight">
        Autentificador
      </span>

      <div className="flex items-center gap-3">
        <Avatar>
          {user?.image && (
            <AvatarImage src={user.image} alt={user?.name ?? ""} />
          )}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {user?.name ?? user?.email}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Cerrar sesión
        </Button>
        <ThemeToggle />
      </div>
    </nav>
  );
}
