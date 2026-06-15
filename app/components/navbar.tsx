"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import ThemeToggle from "@/app/components/theme-toggle";
import { cn } from "@/lib/utils";

interface NavbarProps {
  displayName: string;
}

export default function Navbar({ displayName }: NavbarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-3">
      <span className="text-lg font-semibold tracking-tight">
        Inventario Personal
      </span>

      <div className="flex items-center gap-3">
        <Avatar>
          {user?.image && (
            <AvatarImage src={user.image} alt={displayName} />
          )}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {displayName}
        </span>
        <Link
          href="/dashboard/configuracion"
          aria-label="Configuración"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <Settings />
        </Link>
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
