# Flujo de OAuth 2.0 en este proyecto

Este documento explica, paso a paso, qué ocurre desde que un usuario pulsa
"Iniciar sesión con GitHub" o "Iniciar sesión con Google" hasta que vuelve a
la aplicación ya autenticado. El proyecto usa **NextAuth.js**, que implementa
el flujo **Authorization Code** de OAuth 2.0 por nosotros, pero es importante
entender qué pasa por debajo.

## Los actores

- **Usuario**: la persona que quiere iniciar sesión.
- **Cliente (nuestra app)**: esta aplicación Next.js, que tiene un `clientId`
  y un `clientSecret` registrados en GitHub/Google.
- **Proveedor de identidad (IdP)**: GitHub o Google, quienes autentican al
  usuario y emiten los tokens.

## Paso a paso

### 1. El usuario hace clic en "Iniciar sesión con GitHub/Google"

El botón llama a `signIn("github")` (o `signIn("google")`) de
`next-auth/react`. Esto redirige el navegador del usuario a:

- GitHub: `https://github.com/login/oauth/authorize`
- Google: `https://accounts.google.com/o/oauth2/v2/auth`

NextAuth añade automáticamente parámetros en la URL, entre ellos:

- `client_id`: identifica a nuestra app ante el proveedor.
- `redirect_uri`: la URL de vuelta, en nuestro caso
  `http://localhost:3000/api/auth/callback/github` (o `/google`).
- `scope`: los permisos solicitados (por ejemplo, leer el email y el perfil
  básico del usuario).
- `state`: un valor aleatorio único generado por NextAuth para esta petición.

### 2. El usuario inicia sesión en el proveedor (si no lo había hecho ya)

GitHub o Google muestran su propia pantalla de login. **Nuestra app nunca ve
la contraseña del usuario** — esa parte ocurre completamente en los
servidores del proveedor.

### 3. El proveedor pide consentimiento

El proveedor muestra una pantalla del tipo "Autentificador quiere acceder a:
tu email, tu perfil público. ¿Permitir?". Si el usuario ya dio su
consentimiento antes, este paso puede saltarse.

### 4. El proveedor redirige de vuelta con un "código de autorización"

Si el usuario acepta, el proveedor redirige el navegador a la
`redirect_uri` que configuramos, añadiendo dos parámetros en la URL:

```
http://localhost:3000/api/auth/callback/github?code=XXXXX&state=YYYYY
```

- `code`: el **código de autorización**. Es de un solo uso y de corta
  duración (suele caducar en menos de un minuto). Por sí solo no sirve para
  nada — solo se puede "canjear" desde el backend.
- `state`: el mismo valor que enviamos en el paso 1. NextAuth lo verifica
  para confirmar que esta respuesta corresponde a la petición que nosotros
  iniciamos (protección contra ataques CSRF).

Esta petición llega a nuestro handler:
`app/api/auth/[...nextauth]/route.ts`.

### 5. El servidor canjea el código por tokens (esto NO lo ve el usuario)

Aquí es donde entra nuestro `clientSecret`. El **servidor** de nuestra app
(no el navegador) hace una petición directa, servidor-a-servidor, al
proveedor:

- GitHub: `POST https://github.com/login/oauth/access_token`
- Google: `POST https://oauth2.googleapis.com/token`

enviando `client_id`, `client_secret` y el `code` recibido. El proveedor
responde con un **access token** (y en el caso de Google, también un
**ID token**, un JWT con los datos del usuario firmados).

> El `clientSecret` nunca se expone al navegador. Por eso vive en
> `.env.local` y solo se usa en código que corre en el servidor (el
> route handler de NextAuth).

### 6. La app pide los datos del perfil del usuario

Con el `access token`, nuestro servidor hace una petición a la API del
proveedor para obtener los datos del perfil:

- GitHub: `GET https://api.github.com/user`
- Google: los datos suelen venir directamente en el `ID token` (JWT), o se
  pueden pedir a `https://openidconnect.googleapis.com/v1/userinfo`.

Esto nos da cosas como `id`, `name`, `email`, `avatar_url`.

### 7. NextAuth crea la sesión

Con los datos del usuario, NextAuth genera una sesión (por defecto, un JWT
cifrado y firmado con `NEXTAUTH_SECRET`) y la guarda en una **cookie
httpOnly** del navegador (`next-auth.session-token`).

- `httpOnly` significa que JavaScript del navegador no puede leer esa
  cookie directamente — solo se envía automáticamente al servidor en cada
  petición. Esto protege contra robo de sesión vía XSS.

### 8. Redirección final a la aplicación

NextAuth redirige al usuario de vuelta a la página original de la app (por
defecto, la home `/`). El navegador ya tiene la cookie de sesión, así que:

- En **Client Components**, el hook `useSession()` (gracias al
  `SessionProvider` que envuelve la app) devuelve `status: "authenticated"`
  y los datos del usuario.
- En **Server Components**, se puede llamar a `getServerSession()` /
  `auth()` para leer la sesión desde la cookie.

## Resumen visual

```
Usuario          Nuestra app (cliente)     Nuestra app (servidor)        GitHub/Google
  |  click "Login con GitHub"   |                                |               |
  |----------------------------->                                |               |
  |                              | redirige a authorize?...      |               |
  |-------------------------------------------------------------------------------->
  |          pantalla de login + consentimiento de GitHub/Google                 |
  |<--------------------------------------------------------------------------------|
  |          redirect a /api/auth/callback/github?code=...&state=...             |
  |-------------------------------------------------------------------------------->
  |                                                                | POST /access_token (code + client_secret)
  |                                                                |-------------->|
  |                                                                |   access_token |
  |                                                                |<--------------|
  |                                                                | GET /user (con access_token)
  |                                                                |-------------->|
  |                                                                |  datos usuario |
  |                                                                |<--------------|
  |                              | crea sesión (cookie httpOnly) |               |
  |<------------------------------|                                |               |
  |  redirigido a "/" ya logueado |                                |               |
```

## Diferencias entre GitHub y Google en este flujo

| Aspecto | GitHub | Google |
|---|---|---|
| Estándar | OAuth 2.0 | OAuth 2.0 + OpenID Connect (OIDC) |
| Datos del usuario | Petición extra a `api.github.com/user` | Vienen incluidos en el `ID token` (JWT) |
| Email | Puede no venir si el usuario lo tiene oculto; puede requerir scope `user:email` y una llamada extra a `/user/emails` | Viene en el `ID token` si se solicita el scope `email` |

## Por qué esto es seguro

- El `clientSecret` nunca sale del servidor.
- El `code` de autorización es de un solo uso y expira rápido, por lo que
  interceptarlo no sirve de mucho.
- El parámetro `state` evita que un atacante pueda iniciar el flujo en
  nombre de la víctima (protección CSRF).
- La cookie de sesión es `httpOnly` y está firmada con `NEXTAUTH_SECRET`,
  por lo que no se puede leer ni falsificar desde JavaScript en el
  navegador.
