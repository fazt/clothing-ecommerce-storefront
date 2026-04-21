# Ecommerce API

Express + TypeScript + Prisma + PostgreSQL REST API with a Products CRUD.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the database URL in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce?schema=public"
PORT=3000
```

3. Run the first migration (creates the `Product` table):

```bash
npm run prisma:migrate -- --name init
```

4. Start the dev server:

```bash
npm run dev
```

## Endpoints

Base path: `/api/products`

| Method | Path   | Description        |
| ------ | ------ | ------------------ |
| GET    | `/`    | List all products  |
| GET    | `/:id` | Get product by ID  |
| POST   | `/`    | Create a product   |
| PUT    | `/:id` | Update a product   |
| DELETE | `/:id` | Delete a product   |

### Example body (POST / PUT)

```json
{
  "name": "T-Shirt",
  "description": "Cotton t-shirt",
  "price": 19.99,
  "stock": 100,
  "imageUrl": "https://example.com/tshirt.png"
}
```

## Scripts

- `npm run dev` — start in watch mode with `tsx`
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled server
- `npm run prisma:generate` — regenerate Prisma Client
- `npm run prisma:migrate` — create/apply migrations
- `npm run prisma:studio` — open Prisma Studio
