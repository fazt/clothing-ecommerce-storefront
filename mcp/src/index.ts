#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { apiUrl, request, type Query } from "./client.js";

/** `ECOM_READONLY=1` registers only the read tools (e.g. when pointing at production). */
const READ_ONLY = ["1", "true"].includes(process.env.ECOM_READONLY ?? "");

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const pagination = {
  search: z.string().max(100).optional().describe("Texto a buscar"),
  page: z.number().int().min(1).optional().describe("Página, desde 1"),
  pageSize: z.number().int().min(1).max(100).optional().describe("Resultados por página (máx. 100; por defecto 10)"),
};

const byId = z.object({ id: z.string().min(1) });

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

function createServer() {
  const server = new McpServer({ name: "ecommerce", version: "1.0.0" });

  const listTool = (name: string, path: string, description: string, filters: Record<string, z.ZodType> = {}) =>
    server.registerTool(
      name,
      { description, inputSchema: z.object({ ...pagination, ...filters }), annotations: { readOnlyHint: true } },
      async (query) => json(await request("GET", path, { query: query as Query })),
    );

  const getTool = (name: string, path: string, description: string) =>
    server.registerTool(
      name,
      { description, inputSchema: byId, annotations: { readOnlyHint: true } },
      async ({ id }) => json(await request("GET", `${path}/${encodeURIComponent(id)}`)),
    );

  server.registerTool(
    "whoami",
    {
      description: "URL de la API y usuario con el que este MCP hace las llamadas",
      annotations: { readOnlyHint: true },
    },
    async () => json({ apiUrl, user: await request("GET", "/me") }),
  );

  listTool("list_products", "/products", "Lista productos del catálogo", {
    categoryId: z.string().optional().describe("ID de categoría"),
    stock: z.enum(["in", "low", "out"]).optional().describe("in: con stock, low: menos de 15, out: agotado"),
  });
  getTool("get_product", "/products", "Detalle de un producto con sus variantes");

  listTool("list_categories", "/categories", "Lista categorías", {
    isVisible: z.boolean().optional().describe("Solo visibles (true) u ocultas (false)"),
  });

  listTool("list_orders", "/orders", "Lista pedidos (ADMIN)", {
    status: z.enum(ORDER_STATUSES).optional(),
  });
  getTool("get_order", "/orders", "Detalle de un pedido con productos y cliente (ADMIN)");

  listTool("list_customers", "/customers", "Lista clientes con total gastado y segmento (ADMIN)", {
    segment: z.enum(["new", "returning", "vip"]).optional(),
  });
  getTool("get_customer", "/customers", "Detalle de un cliente (ADMIN)");

  listTool("list_discounts", "/discounts", "Lista códigos de descuento (ADMIN)", {
    type: z.enum(["PERCENT", "FIXED", "SHIPPING"]).optional(),
    status: z.enum(["ACTIVE", "SCHEDULED", "EXPIRED"]).optional(),
  });

  listTool("list_users", "/users", "Lista usuarios de la plataforma (ADMIN)", {
    role: z.enum(["USER", "ADMIN"]).optional(),
  });

  server.registerTool(
    "analytics_summary",
    {
      description: "Resumen de los últimos 30 días: ventas, pedidos, clientes nuevos y productos top (ADMIN)",
      annotations: { readOnlyHint: true },
    },
    async () => json(await request("GET", "/analytics/summary")),
  );

  if (READ_ONLY) return server;

  server.registerTool(
    "update_order_status",
    {
      description: "Cambia el estado de un pedido (ADMIN)",
      inputSchema: z.object({ id: z.string().min(1), status: z.enum(ORDER_STATUSES) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ id, status }) => json(await request("PATCH", `/orders/${encodeURIComponent(id)}`, { body: { status } })),
  );

  server.registerTool(
    "update_product",
    {
      description: "Actualiza campos de un producto; solo se cambian los campos enviados y las variantes no se tocan (ADMIN)",
      inputSchema: z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).optional(),
        price: z.number().min(0).optional(),
        stock: z.number().int().min(0).optional(),
        categoryId: z.string().optional().describe('ID de categoría ("" la quita)'),
        isNew: z.boolean().optional(),
        isSale: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ id, ...fields }) => json(await request("PATCH", `/products/${encodeURIComponent(id)}`, { body: fields })),
  );

  server.registerTool(
    "create_discount",
    {
      description: "Crea un código de descuento (ADMIN)",
      inputSchema: z.object({
        code: z.string().regex(/^[A-Za-z0-9_-]+$/).max(50).describe("Se guarda en mayúsculas"),
        type: z.enum(["PERCENT", "FIXED", "SHIPPING"]),
        value: z.number().min(0).describe("Porcentaje (máx. 100) o importe fijo"),
        description: z.string().max(255).optional(),
        limit: z.number().int().min(1).optional().describe("Usos máximos"),
        expiresAt: z.string().optional().describe("Fecha ISO de caducidad"),
        status: z.enum(["ACTIVE", "SCHEDULED", "EXPIRED"]).optional(),
      }),
      annotations: { destructiveHint: false },
    },
    async (body) => json(await request("POST", "/discounts", { body })),
  );

  return server;
}

serveStdio(createServer);
