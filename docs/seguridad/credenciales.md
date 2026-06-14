# Almacenamiento seguro de contraseñas

Este documento explica por qué nunca se deben guardar contraseñas en texto
plano y cómo funcionan los algoritmos de hashing que se usan en su lugar
(bcrypt, argon2) y los "salts".

> Nota sobre este proyecto: nuestro `CredentialsProvider` (ver
> `app/lib/auth.ts`) no guarda ni gestiona contraseñas directamente — delega
> esa responsabilidad en Firebase Identity Toolkit, que ya aplica hashing
> seguro internamente. Aun así, es fundamental entender *por qué* esto es
> así, porque tarde o temprano cualquier desarrollador se encuentra con un
> sistema que gestiona credenciales directamente.

## Por qué nunca guardar contraseñas en texto plano

Guardar la contraseña tal cual la escribe el usuario (`"miPassword123"`) en
una columna de la base de datos es uno de los errores de seguridad más
graves que puede cometer una aplicación, por varias razones:

1. **Una fuga de base de datos lo expone todo de inmediato.** Si un
   atacante consigue acceso de lectura a la base de datos (por una
   inyección SQL, un backup mal protegido, un empleado malicioso, etc.),
   obtiene directamente las contraseñas de todos los usuarios, sin ningún
   esfuerzo adicional.

2. **Los usuarios reutilizan contraseñas.** La mayoría de las personas usan
   la misma contraseña (o variantes muy parecidas) en varios servicios. Si
   se filtra la contraseña en texto plano de tu app, un atacante puede
   probarla directamente en el email, el banco o las redes sociales de esa
   persona ("credential stuffing").

3. **Ni siquiera el equipo que desarrolla la app debería poder ver las
   contraseñas.** Si están en texto plano, cualquiera con acceso a la base
   de datos (administradores, soporte técnico, un script de debug mal
   escrito) puede leerlas. Esto es tanto un riesgo de seguridad como, en
   muchos casos, un incumplimiento legal (RGPD y normativas similares
   exigen "medidas técnicas apropiadas" para proteger datos de
   autenticación).

4. **No hay forma de "deshacer" el daño.** A diferencia de una tarjeta de
   crédito robada (que se puede cancelar), una contraseña filtrada sigue
   siendo válida hasta que el usuario la cambie en todos los sitios donde
   la usa — y muchos usuarios nunca lo hacen.

La solución es no guardar la contraseña en absoluto, sino un **hash** de
la contraseña.

## ¿Qué es un hash de contraseña?

Un hash es el resultado de pasar la contraseña por una función matemática
de un solo sentido (one-way function):

```
hash("miPassword123") -> "x8K2$jLp9...." (cadena de longitud fija)
```

Propiedades clave:

- **Es determinista**: la misma entrada siempre produce la misma salida.
- **Es (prácticamente) irreversible**: a partir del hash, no se puede
  recuperar la contraseña original. La única forma de "adivinarla" es
  probar contraseñas candidatas y comparar sus hashes (fuerza bruta).
- **Pequeños cambios producen salidas completamente distintas**: cambiar
  una letra de la contraseña produce un hash totalmente diferente, no
  "parecido".

Cuando el usuario inicia sesión, el sistema no compara la contraseña que
escribe con la guardada — calcula su hash y compara **ese hash** con el
hash almacenado. Si la base de datos se filtra, el atacante solo obtiene
los hashes, no las contraseñas.

## ¿Por qué no basta con un hash genérico como SHA-256?

Algoritmos como `MD5` o `SHA-256` están diseñados para ser **rápidos** —
son perfectos para verificar la integridad de un archivo, pero un atacante
con GPUs modernas puede calcular miles de millones de hashes SHA-256 por
segundo. Esto hace viables dos ataques:

- **Fuerza bruta / diccionario**: probar contraseñas comunes una por una
  hasta encontrar una que coincida con el hash filtrado.
- **Rainbow tables**: tablas precalculadas de `contraseña -> hash` para
  millones de contraseñas comunes, que permiten "deshacer" el hash al
  instante por simple búsqueda.

Por eso, para contraseñas se usan algoritmos de hashing **diseñados para
ser lentos y costosos de calcular a propósito**: bcrypt y argon2.

## bcrypt

`bcrypt` es un algoritmo de hashing de contraseñas de 1999, todavía muy
usado hoy. Sus características principales:

- **Factor de coste configurable** (`cost factor` o `rounds`): un número
  que indica cuántas veces se repite internamente el cálculo. Cada
  incremento de 1 en el coste **duplica** el tiempo de cálculo. Esto
  permite ajustar bcrypt para que tarde, por ejemplo, ~100-300ms en el
  hardware actual — insignificante para un login legítimo, pero
  prohibitivo si hay que probar millones de combinaciones.
- **Salt incorporado**: cada vez que se genera un hash con bcrypt, se
  genera también un salt aleatorio que queda embebido en la propia cadena
  de salida. No hace falta guardarlo en una columna aparte.
- El resultado tiene un formato reconocible, por ejemplo:
  ```
  $2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW
  └┬─┘└┬┘└──────────┬───────────┘└────────────┬─────────────┘
   │   │            salt (16 bytes)            hash resultante
   │   └─ factor de coste (12 = 2^12 iteraciones)
   └─ versión del algoritmo
  ```

## argon2

`argon2` es más moderno (ganador del Password Hashing Competition de 2015)
y se considera el estándar recomendado actualmente. Mejora a bcrypt en un
punto clave: además de ser lento en *tiempo* (CPU), también se puede
configurar para consumir mucha **memoria** durante el cálculo.

- **Resistente a ataques con hardware especializado (GPU/ASIC)**: los
  atacantes que quieren probar miles de millones de contraseñas en
  paralelo suelen usar GPUs o chips dedicados, que tienen mucha capacidad
  de cómputo pero memoria limitada por unidad. Si el algoritmo requiere,
  por ejemplo, 64 MB de RAM por cada hash calculado, ese hardware deja de
  ser tan eficiente.
- Tiene tres parámetros configurables: **tiempo** (iteraciones), **memoria**
  (cuánta RAM usar) y **paralelismo** (cuántos hilos).
- Existen tres variantes (`argon2d`, `argon2i`, `argon2id`); `argon2id` es
  la recomendada de forma general porque combina resistencia a ataques de
  canal lateral y a ataques con GPU.

## ¿Qué es el "salt" y por qué es imprescindible?

Un **salt** es un valor aleatorio único, generado para cada usuario/cada
contraseña, que se combina con la contraseña antes de calcular el hash:

```
hash(contraseña + salt) -> hash_final
```

El salt se guarda junto al hash (no necesita ser secreto), normalmente
concatenado en la misma cadena (como en el ejemplo de bcrypt arriba).

¿Por qué es imprescindible?

- **Sin salt**, dos usuarios con la misma contraseña (`"123456"`) tendrían
  exactamente el mismo hash. Un atacante podría detectar esto y, al
  romper un hash, romper automáticamente todas las cuentas con esa misma
  contraseña.
- **Sin salt**, un atacante puede precalcular una rainbow table una sola
  vez y reutilizarla contra cualquier base de datos filtrada.
- **Con un salt distinto por usuario**, cada hash es único incluso si la
  contraseña en texto plano es idéntica. El atacante tendría que atacar
  cada hash individualmente, sin poder reutilizar trabajo previo entre
  usuarios ni entre distintos sistemas.

bcrypt y argon2 generan y gestionan el salt automáticamente como parte del
algoritmo — el desarrollador no tiene que implementarlo a mano (ni
debería: generar salts manualmente con `Math.random()` o similar sería
inseguro, hace falta un generador criptográficamente seguro).

## Resumen

| Concepto | Qué es | Por qué importa |
|---|---|---|
| Texto plano | Guardar la contraseña tal cual | Una fuga expone todas las contraseñas reales al instante |
| Hash | Resultado de una función de un solo sentido | Permite verificar contraseñas sin guardarlas |
| Hash rápido (SHA-256, MD5) | Hash genérico, optimizado para velocidad | Vulnerable a fuerza bruta y rainbow tables |
| bcrypt / argon2 | Hash lento y costoso, con coste configurable | Hace que probar millones de contraseñas sea inviable |
| Salt | Valor aleatorio único por contraseña | Evita rainbow tables y que contraseñas iguales den el mismo hash |

En este proyecto, todo esto lo gestiona Firebase Identity Toolkit cuando
llamamos a `accounts:signUp` (registro) y `accounts:signInWithPassword`
(login) — nuestro backend nunca ve ni almacena la contraseña en ningún
formato, ni siquiera hasheada.
