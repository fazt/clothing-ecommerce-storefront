import { oneOf } from "../parsers.js";
import { resourceCommand } from "./resource.js";

interface Category extends Record<string, unknown> {
  id: string;
  slug: string;
  name: string;
  isVisible: boolean;
  _count?: { products: number };
}

export const categoriesCommand = () =>
  resourceCommand<Category>({
    command: "categories",
    path: "/categories",
    noun: "categoría",
    plural: "categorías",
    feminine: true,
    description: "Categorías del catálogo (crear, editar y eliminar requiere ADMIN)",
    label: (cat) => `"${cat.name}"`,
    columns: [
      { header: "ID", value: (cat) => cat.id },
      { header: "SLUG", value: (cat) => cat.slug },
      { header: "NOMBRE", value: (cat) => cat.name, max: 30 },
      { header: "VISIBLE", value: (cat) => cat.isVisible },
      { header: "PRODUCTOS", value: (cat) => cat._count?.products, align: "right" },
    ],
    filters: [
      {
        flags: "--visible <bool>",
        param: "isVisible",
        description: "true | false",
        parse: oneOf(["true", "false"]),
      },
    ],
    fields: [
      { flags: "--slug <slug>", key: "slug", description: "slug (minúsculas, números y guiones)" },
      { flags: "--name <name>", key: "name", description: "nombre" },
      { flags: "--image <url>", key: "image", description: 'URL de imagen ("" la quita)' },
      { flags: "--visible", key: "isVisible", description: "visible en la tienda" },
    ],
  });
