import { date, statusStyle } from "../output.js";
import { oneOf } from "../parsers.js";
import { resourceCommand } from "./resource.js";

const ROLES = ["USER", "ADMIN"] as const;

interface User extends Record<string, unknown> {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export const usersCommand = () =>
  resourceCommand<User>({
    command: "users",
    path: "/users",
    noun: "usuario",
    plural: "usuarios",
    description: "Cuentas de usuario (requiere ADMIN)",
    label: (u) => u.email,
    columns: [
      { header: "ID", value: (u) => u.id },
      { header: "EMAIL", value: (u) => u.email, max: 32 },
      { header: "NOMBRE", value: (u) => u.name, max: 24 },
      { header: "ROL", value: (u) => u.role, style: statusStyle },
      { header: "CREADO", value: (u) => date(u.createdAt) },
    ],
    filters: [{ flags: "--role <role>", param: "role", description: ROLES.join(" | "), parse: oneOf(ROLES) }],
    fields: [
      { flags: "--email <email>", key: "email", description: "email", only: "create" },
      { flags: "--password <password>", key: "password", description: "contraseña (mín. 6)" },
      { flags: "--name <name>", key: "name", description: "nombre" },
      { flags: "--role <role>", key: "role", description: ROLES.join(" | "), parse: oneOf(ROLES) },
    ],
  });
