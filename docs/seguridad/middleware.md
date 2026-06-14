# Proteger rutas: middleware/proxy vs cliente

Este documento explica la diferencia entre proteger `/dashboard` con el
middleware de servidor (en este proyecto, `proxy.ts`) y protegerlo solo en
el cliente con un `useEffect`, y por qué la segunda opción no es segura por
sí sola.

> Nota sobre nombres: en Next.js 16, `middleware.ts` ha sido renombrado a
> `proxy.ts`, pero el concepto y el propósito son los mismos que el
> "middleware" clásico: código que se ejecuta **en el servidor**, antes de
> que la petición llegue a la página.

## Opción A: protección en el servidor (`proxy.ts`)

En este proyecto, `proxy.ts` usa `withAuth` de `next-auth/middleware`:

```ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

¿Qué pasa cuando alguien (autenticado o no) pide `/dashboard`?

1. La petición HTTP llega al servidor de Next.js.
2. **Antes de renderizar nada**, `proxy.ts` se ejecuta y comprueba si existe
   una cookie de sesión válida (`next-auth.session-token`), verificando su
   firma con `NEXTAUTH_SECRET`.
3. Si no hay sesión válida, el servidor responde directamente con un
   **307 Temporary Redirect** a `/login?callbackUrl=/dashboard`. El HTML de
   `/dashboard` **nunca se genera ni se envía** al navegador.
4. Si hay sesión válida, la petición continúa normalmente y la página se
   renderiza.

El punto clave: la decisión se toma **en el servidor, con datos que el
servidor controla** (la cookie firmada). El cliente no puede manipular esta
comprobación.

## Opción B: protección en el cliente (`useEffect`)

Una alternativa (incorrecta si se usa en solitario) sería renderizar la
página del dashboard normalmente y, ya en el navegador, hacer algo así:

```tsx
"use client";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  return <div>Contenido privado...</div>;
}
```

Aquí la secuencia es muy distinta:

1. El servidor **ya envió el HTML, el JavaScript y el bundle completo de la
   página** al navegador, sin comprobar nada.
2. El navegador descarga y ejecuta ese JavaScript.
3. Solo entonces se ejecuta el `useEffect`, comprueba la sesión y, si no hay
   usuario, redirige a `/login`.

Es decir: **primero se entrega todo, y después se decide si el usuario podía
verlo**.

## Riesgos de proteger solo en el cliente

1. **El contenido ya viaja al navegador.** Aunque la redirección sea casi
   instantánea visualmente, el HTML/JSON/JS de la página privada ha sido
   descargado. Cualquiera puede ver ese contenido:
   - Mirando la pestaña "Network" de las herramientas de desarrollador.
   - Usando `curl` o `fetch` directamente, sin ejecutar JavaScript en
     absoluto. El `useEffect` **nunca se ejecuta** fuera de un navegador, así
     que la "protección" simplemente no existe para ese cliente.

2. **JavaScript es opcional y manipulable.** Un atacante puede:
   - Desactivar JavaScript.
   - Interceptar la respuesta antes de que el `useEffect` se dispare.
   - Modificar el bundle en su propio navegador (DevTools) para que la
     comprobación nunca se ejecute o nunca redirija.

3. **Cualquier dato sensible incluido en el render inicial queda expuesto.**
   Si el componente del dashboard recibe props con datos del usuario (por
   ejemplo, vía `getServerSideProps`-equivalente o un fetch que se resuelve
   antes del `useEffect`), esos datos están en el HTML/JSON que ya se envió,
   estén o no protegidos visualmente.

4. **Falsa sensación de seguridad.** Visualmente parece que "funciona"
   (el usuario ve un parpadeo y acaba en `/login`), pero esa comprobación
   solo protege la **experiencia de uso normal**, no actúa como control de
   acceso real.

## Conclusión: las dos capas tienen propósitos distintos

- **`proxy.ts` (servidor)**: es el control de acceso real. Decide, antes de
  generar la respuesta, si la petición tiene derecho a ver `/dashboard`. Es
  la única capa en la que se debe confiar para seguridad.
- **`useSession()` / `useEffect` (cliente)**: sirve para mejorar la
  experiencia de usuario dentro de una página ya autorizada — por ejemplo,
  mostrar un spinner mientras se carga la sesión, ocultar/mostrar botones
  según el estado de login, o redirigir si la sesión expira mientras el
  usuario navega (sin necesitar una nueva petición al servidor). Nunca debe
  ser la única barrera para contenido o datos sensibles.

En este proyecto, `proxy.ts` ya cubre `/dashboard` a nivel de servidor, y
además `app/dashboard/page.tsx` vuelve a comprobar la sesión con
`getServerSession()` antes de renderizar — defensa en profundidad: si por
algún motivo el middleware no se aplicara, la propia página seguiría
bloqueando el acceso desde el servidor.
