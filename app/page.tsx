import Link from "next/link";
import { Package, CreditCard, BookOpen, Bell } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/app/components/theme-toggle";

const FEATURES = [
  {
    icon: Package,
    title: "Equipos",
    description:
      "Guarda tus dispositivos con su número de serie y la fecha de garantía.",
  },
  {
    icon: CreditCard,
    title: "Suscripciones",
    description:
      "Lleva el control de los servicios que pagas y cuándo se renuevan.",
  },
  {
    icon: BookOpen,
    title: "Colecciones",
    description: "Organiza tus libros y otros objetos que quieras catalogar.",
  },
  {
    icon: Bell,
    title: "Avisos",
    description:
      "Recibe un aviso en tu panel antes de que algo venza o se renueve.",
  },
];

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-12 bg-background px-6 py-16 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Autentificador
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Tu inventario personal: equipos, suscripciones y colecciones en un
          solo sitio, con avisos antes de que algo venza o haya que renovarlo.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Crear cuenta
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="mb-2 size-6 text-primary" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
