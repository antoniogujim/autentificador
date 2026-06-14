# Autentificador

Demo educativa de autenticación construida con **Next.js 16 (App Router)** y
**NextAuth.js v4**, que combina dos enfoques distintos en una misma
aplicación:

- **OAuth "clásico"** con GitHub, gestionado íntegramente por NextAuth.
- **Email/contraseña** y **Google**, gestionados por **Firebase
  Authentication** (Identity Toolkit) y conectados a NextAuth mediante
  `CredentialsProvider`.

El objetivo del proyecto es servir como referencia práctica de los
distintos flujos de autenticación (Authorization Code de OAuth, login con
credenciales propias, login social vía Firebase) y de las decisiones de
seguridad que hay detrás de cada uno — documentadas en [`docs/seguridad/`](#documentación-de-seguridad).

## Stack técnico

- [Next.js 16](https://nextjs.org/) (App Router, `proxy.ts` como reemplazo
  de `middleware.ts`)
- [React 19](https://react.dev/)
- [NextAuth.js v4](https://next-auth.js.org/) (`next-auth@4`)
- [Firebase](https://firebase.google.com/) — Authentication (Email/Password
  y Google) vía SDK cliente y API REST de Identity Toolkit
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (estilo `base-nova`, primitivas
  [`@base-ui/react`](https://base-ui.com/))
- TypeScript

## Funcionalidades

- **Landing pública** (`/`) con enlace a login.
- **Login personalizado** (`/login`) con tres métodos:
  - Email/contraseña (`CredentialsProvider` → Firebase Identity Toolkit
    `signInWithPassword`).
  - Google (popup de Firebase Auth → `CredentialsProvider` que valida el
    `idToken` con Identity Toolkit).
  - GitHub (`GithubProvider` nativo de NextAuth).
- **Registro** (`/register`) con email/contraseña usando
  `createUserWithEmailAndPassword` del SDK cliente de Firebase, con login
  automático tras registrarse.
- **Dashboard privado** (`/dashboard`):
  - Protegido a nivel de servidor por `proxy.ts` (middleware de Next.js
    16), que redirige a `/login?callbackUrl=/dashboard` si no hay sesión.
  - Doble comprobación con `getServerSession()` dentro de la propia
    página (defensa en profundidad).
  - `Navbar` (Client Component) que muestra avatar, nombre/email del
    usuario autenticado y botón de **cerrar sesión** funcional
    (`signOut`).
- Mensajes de error traducidos al español en los formularios de login y
  registro (credenciales inválidas, email ya registrado, contraseña débil,
  etc.).

## Estructura del proyecto

```
app/
├── page.tsx                    # Landing pública
├── layout.tsx                  # Layout raíz, envuelve la app en <Providers>
├── providers.tsx               # <SessionProvider> de next-auth/react
├── globals.css                 # Tema y variables de shadcn/Tailwind
│
├── api/auth/[...nextauth]/
│   └── route.ts                # Handler de NextAuth (GET/POST)
│
├── lib/
│   ├── auth.ts                 # authOptions: providers (GitHub, Credentials, Firebase Google)
│   └── firebase.ts             # Inicialización del SDK cliente de Firebase
│
├── login/
│   ├── page.tsx                # Página de login (Server Component)
│   ├── credentials-form.tsx    # Formulario email/contraseña
│   ├── login-buttons.tsx       # Botón "Continuar con GitHub"
│   └── google-button.tsx       # Botón "Continuar con Google" (Firebase popup)
│
├── register/
│   ├── page.tsx                # Página de registro
│   └── register-form.tsx       # Formulario de registro (Firebase Auth)
│
├── dashboard/
│   └── page.tsx                # Área privada (getServerSession + Navbar)
│
└── components/
    └── navbar.tsx               # Navbar (Client Component) con sesión y logout

components/ui/                  # Componentes shadcn (Button, Card, Input, Label, Alert, Avatar)
lib/utils.ts                    # Helper cn() de shadcn

proxy.ts                         # Middleware (Next.js 16) que protege /dashboard

docs/seguridad/
├── oauth.md                     # Flujo OAuth 2.0 paso a paso (GitHub y Google)
├── middleware.md                # Protección en servidor vs. cliente
└── credenciales.md               # Por qué no guardar contraseñas en texto plano (bcrypt/argon2/salts)
```

## Requisitos previos

- Node.js 20+
- Una **OAuth App de GitHub** (para el login con GitHub).
- Un **proyecto de Firebase** con:
  - El proveedor **Email/Password** habilitado en
    *Authentication → Sign-in method*.
  - El proveedor **Google** habilitado en
    *Authentication → Sign-in method*.
  - Una app web registrada (para obtener el `firebaseConfig`).

## Variables de entorno

Crea un archivo `.env.local` en la raíz con las siguientes variables:

```bash
# NextAuth
NEXTAUTH_SECRET=   # genera uno con: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# OAuth App de GitHub (https://github.com/settings/developers)
GITHUB_ID=
GITHUB_SECRET=

# Firebase (config pública del cliente, ver Project settings > General > Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

> `.env.local` está en `.gitignore` y nunca debe subirse al repositorio.
> La `NEXT_PUBLIC_FIREBASE_API_KEY` no es secreta (está diseñada para
> exponerse al cliente), pero `GITHUB_SECRET` y `NEXTAUTH_SECRET` sí lo son
> — la seguridad real de Firebase recae en las reglas de seguridad y en las
> restricciones de la API key en Google Cloud Console.

Para la OAuth App de GitHub, configura como **Authorization callback URL**:

```
http://localhost:3000/api/auth/callback/github
```

(en producción, sustituye por el dominio de despliegue).

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

- `/` — landing pública
- `/login` — login (email/contraseña, Google o GitHub)
- `/register` — crear cuenta con email/contraseña
- `/dashboard` — área privada (requiere sesión)

## Flujos de autenticación

| Método | Quién valida | Cómo se conecta a NextAuth |
|---|---|---|
| GitHub | NextAuth (`GithubProvider`) | Flujo OAuth 2.0 estándar gestionado por NextAuth |
| Email/contraseña | Firebase Identity Toolkit (`accounts:signInWithPassword`) | `CredentialsProvider` (`id: "credentials"`) hace la llamada REST en `authorize()` |
| Google | Firebase Auth (popup, `GoogleAuthProvider`) | El cliente obtiene un `idToken` de Firebase y lo envía a `CredentialsProvider` (`id: "firebase-google"`), que lo valida con `accounts:lookup` |

En los tres casos, NextAuth termina creando la misma sesión JWT
(`next-auth.session-token`, cookie `httpOnly`), por lo que el resto de la
app (middleware, `getServerSession`, `useSession`) no necesita distinguir
cómo se autenticó el usuario.

## Documentación de seguridad

La carpeta [`docs/seguridad/`](docs/seguridad) contiene los análisis
escritos durante el desarrollo:

- **[oauth.md](docs/seguridad/oauth.md)** — qué ocurre paso a paso desde que
  el usuario pulsa "Iniciar sesión con GitHub/Google" hasta que vuelve
  autenticado, y por qué el flujo es seguro (`clientSecret` solo en
  servidor, `code` de un solo uso, `state` anti-CSRF, cookies `httpOnly`).
- **[middleware.md](docs/seguridad/middleware.md)** — diferencia entre
  proteger `/dashboard` en `proxy.ts` (servidor) frente a un `useEffect`
  en el cliente, y los riesgos de depender solo del cliente.
- **[credenciales.md](docs/seguridad/credenciales.md)** — por qué nunca se
  guardan contraseñas en texto plano, y cómo funcionan bcrypt, argon2 y los
  *salts*.

## Despliegue

El proyecto está pensado para desplegarse en [Vercel](https://vercel.com/).
Pasos adicionales necesarios al desplegar:

1. Configurar en Vercel todas las variables de entorno listadas arriba,
   ajustando `NEXTAUTH_URL` al dominio de producción
   (`https://tu-app.vercel.app`).
2. Añadir `https://tu-app.vercel.app/api/auth/callback/github` como
   Authorization callback URL en la OAuth App de GitHub.
3. Añadir el dominio de Vercel a *Authentication → Settings → Authorized
   domains* en Firebase Console (necesario para el popup de Google).

## Scripts

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción
npm run start   # servidor de producción
npm run lint    # ESLint
```
