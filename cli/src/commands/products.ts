import { c, keyValues, money, section, table } from "../output.js";
import { oneOf, toInt, toList, toNumber } from "../parsers.js";
import { resourceCommand } from "./resource.js";

/** LOW_STOCK_THRESHOLD in api/src/modules/products/product.schema.ts */
const LOW_STOCK = 15;

interface Variant extends Record<string, unknown> {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  price: string | null;
}

interface Product extends Record<string, unknown> {
  id: string;
  name: string;
  price: string;
  stock: number;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  category: { id: string; name: string } | null;
  variants?: Variant[];
}

function stockStyle(cell: string, row: { stock: number }) {
  if (row.stock === 0) return c.red(cell);
  if (row.stock < LOW_STOCK) return c.yellow(cell);
  return cell;
}

function tags(p: Product) {
  return [p.isNew && "nuevo", p.isSale && "oferta", p.isFeatured && "destacado"]
    .filter(Boolean)
    .join(", ");
}

export const productsCommand = () =>
  resourceCommand<Product>({
    command: "products",
    path: "/products",
    noun: "producto",
    plural: "productos",
    description: "Catálogo de productos (crear, editar y eliminar requiere ADMIN)",
    label: (p) => `"${p.name}"`,
    columns: [
      { header: "ID", value: (p) => p.id },
      { header: "NOMBRE", value: (p) => p.name, max: 36 },
      { header: "PRECIO", value: (p) => money(p.price), align: "right" },
      { header: "STOCK", value: (p) => p.stock, align: "right", style: stockStyle },
      { header: "CATEGORÍA", value: (p) => p.category?.name, max: 20 },
      { header: "ETIQUETAS", value: tags },
    ],
    filters: [
      { flags: "--category <id>", param: "categoryId", description: "filtra por categoría" },
      {
        flags: "--stock <nivel>",
        param: "stock",
        description: "in | low | out",
        parse: oneOf(["in", "low", "out"]),
      },
    ],
    fields: [
      { flags: "--name <name>", key: "name", description: "nombre" },
      { flags: "--description <text>", key: "description", description: "descripción" },
      { flags: "--price <price>", key: "price", description: "precio", parse: toNumber },
      { flags: "--stock <n>", key: "stock", description: "unidades en stock", parse: toInt },
      { flags: "--image <url>", key: "imageUrl", description: "imagen principal" },
      { flags: "--images <urls>", key: "images", description: "galería (URLs separadas por coma)", parse: toList },
      { flags: "--category <id>", key: "categoryId", description: 'ID de categoría ("" la quita)' },
      { flags: "--new", key: "isNew", description: "marca como nuevo" },
      { flags: "--sale", key: "isSale", description: "marca como oferta" },
      { flags: "--featured", key: "isFeatured", description: "marca como destacado" },
    ],
    detail: (p) => {
      keyValues(p);
      if (!p.variants?.length) return;
      section(`Variantes (${p.variants.length})`);
      table(p.variants, [
        { header: "ID", value: (v) => v.id },
        { header: "TALLA", value: (v) => v.size },
        { header: "COLOR", value: (v) => v.color },
        { header: "SKU", value: (v) => v.sku },
        { header: "STOCK", value: (v) => v.stock, align: "right", style: stockStyle },
        { header: "PRECIO", value: (v) => (v.price === null ? null : money(v.price)), align: "right" },
      ]);
    },
  });
