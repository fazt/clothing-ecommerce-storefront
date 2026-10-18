# Diagrama de arquitectura

Vista general del monorepo: quién habla con quién y por qué camino. El detalle de cada flujo está en [`architecture.md`](./architecture.md) y el modelo de datos en [`database.md`](./database.md).

```mermaid
flowchart LR
  subgraph USERS["Usuarios"]
    direction TB
    BROWSER["Navegador<br/>clientes y admins"]
    CLI["CLI ecom<br/>cli · Commander"]
  end

  subgraph WEB["web · Next.js 16 App Router · Railway"]
    direction TB
    PROXY["proxy.ts<br/>protege /dashboard/** por cookie"]
    STORE["(store)<br/>home · catálogo · producto<br/>carrito · checkout"]
    AUTHUI["(auth)<br/>login · registro<br/>recuperar contraseña"]
    DASH["dashboard<br/>admin: CRUD y analytics<br/>cliente: mis pedidos y perfil"]
    RSC["Server Components<br/>lib/api.ts · lecturas"]
    SA["Server Action<br/>newsletter-actions.ts"]
    CC["Client Components<br/>lib/api-client.ts<br/>mutaciones y tablas"]
  end

  subgraph API["api · Express + TypeScript · Railway"]
    direction TB
    MW["Middleware<br/>CORS · cookie-parser · validación Zod<br/>requireAuth · requireAdmin"]
    PUB["Públicos<br/>products y categories (lectura)<br/>newsletter · payments/methods"]
    ACC["Cuenta<br/>auth: emite la cookie JWT<br/>me: perfil y pedidos"]
    ADM["Solo ADMIN<br/>users · customers · orders<br/>discounts · analytics<br/>escritura de products y categories"]
    PAY["payments<br/>Stripe Checkout · PayPal Orders v2"]
    UPL["storage<br/>POST /uploads · multer"]
    MAIL["email<br/>servicio interno"]
    PRISMA["Prisma Client"]
  end

  DB[("PostgreSQL · Railway<br/>User · Product · ProductVariant<br/>Category · Customer · Order<br/>Discount · NewsletterSubscriber")]

  subgraph EXT["Servicios externos"]
    direction TB
    STRIPE["Stripe"]
    PAYPAL["PayPal"]
    RESEND["Resend<br/>emails"]
    SPACES["DigitalOcean Spaces<br/>imágenes (S3)"]
  end

  BROWSER -->|"páginas"| PROXY
  PROXY --> STORE & AUTHUI & DASH
  STORE & DASH --> RSC
  STORE --> SA
  STORE & AUTHUI & DASH --> CC

  CC -->|"fetch + cookie auth-token"| MW
  RSC -->|"cookie reenviada como Bearer"| MW
  SA -->|"POST /newsletter"| MW
  CLI -->|"REST + Bearer<br/>token leído de Set-Cookie"| MW

  MW --> PUB & ACC & ADM & PAY & UPL
  PUB & ACC & ADM & PAY --> PRISMA
  PRISMA --> DB

  ACC -->|"reset de contraseña"| MAIL
  PAY -->|"confirmación de pedido"| MAIL
  MAIL --> RESEND
  PAY -->|"crea sesión / captura"| STRIPE
  PAY -->|"crea orden / captura"| PAYPAL
  STRIPE -.->|"webhook"| PAY
  UPL -->|"PutObject"| SPACES
  BROWSER -.->|"redirige para pagar"| STRIPE
  BROWSER -.-> PAYPAL

  classDef user fill:#eef2ff,stroke:#6366f1,color:#1e1b4b
  classDef web fill:#ecfeff,stroke:#0891b2,color:#083344
  classDef api fill:#f0fdf4,stroke:#16a34a,color:#052e16
  classDef data fill:#fff7ed,stroke:#ea580c,color:#431407
  classDef ext fill:#f5f5f4,stroke:#78716c,color:#1c1917

  class BROWSER,CLI user
  class PROXY,STORE,AUTHUI,DASH,RSC,SA,CC web
  class MW,PUB,ACC,ADM,PAY,UPL,MAIL,PRISMA api
  class DB data
  class STRIPE,PAYPAL,RESEND,SPACES ext
```

**Cómo leerlo**

- Flecha continua: llamada directa. Flecha punteada: redirección del navegador o webhook.
- La sesión es un JWT que la API entrega en la cookie HttpOnly `auth-token`. El navegador la manda sola; el servidor de Next y el CLI la envían como `Authorization: Bearer`.
- Hay tres caminos de la web a la API: Client Components (mutaciones), Server Components (lecturas) y la Server Action del newsletter.
- Toda escritura en la base pasa por la API. Ni la web ni el CLI tocan Postgres directamente.
