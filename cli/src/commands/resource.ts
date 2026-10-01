import { Command, Option } from "commander";
import type { Paginated, Query } from "../client.js";
import { clientFor } from "../context.js";
import { CliError } from "../errors.js";
import { c, emit, keyValues, pageFooter, success, table, type Column } from "../output.js";
import { parseData, toInt } from "../parsers.js";
import { canPrompt, confirm } from "../prompt.js";

export type Row = Record<string, unknown> & { id: string };

export interface FilterSpec {
  /** e.g. "--status <status>" */
  flags: string;
  /** Query-string parameter sent to the API. */
  param: string;
  description: string;
  parse?: (value: string) => string;
}

export interface FieldSpec {
  /** e.g. "--price <price>"; a flag without value (e.g. "--featured") also gets "--no-featured". */
  flags: string;
  /** Body property sent to the API. */
  key: string;
  description: string;
  parse?: (value: string) => unknown;
  only?: "create" | "update";
}

export interface ResourceSpec<T extends Row> {
  command: string;
  path: string;
  /** Nouns used in messages, e.g. "producto" / "productos". */
  noun: string;
  plural: string;
  feminine?: boolean;
  description: string;
  columns: Column<T>[];
  /** How a record is named in messages, e.g. `"Camiseta"`. */
  label: (row: T) => string;
  filters?: FilterSpec[];
  /** Body fields for create/update; without them only list/get/delete are added. */
  fields?: FieldSpec[];
  detail?: (row: T) => void;
}

export function messages({ noun, feminine }: { noun: string; feminine?: boolean }) {
  const end = feminine ? "a" : "o";
  const Noun = noun[0].toUpperCase() + noun.slice(1);
  return {
    a: `${feminine ? "una" : "un"} ${noun}`,
    created: `${Noun} cread${end}`,
    updated: `${Noun} actualizad${end}`,
    deleted: `${Noun} eliminad${end}`,
  };
}

/** Adds the field options to `command` and returns a reader that builds the request body. */
function addFields(command: Command, fields: FieldSpec[], mode: "create" | "update") {
  const bindings: [attribute: string, key: string][] = [];
  for (const field of fields) {
    if (field.only && field.only !== mode) continue;
    const option = new Option(field.flags, field.description);
    if (field.parse) option.argParser(field.parse);
    command.addOption(option);
    if (option.isBoolean() && option.long) {
      command.addOption(new Option(`--no-${option.long.slice(2)}`, `lo contrario de ${option.long}`));
    }
    bindings.push([option.attributeName(), field.key]);
  }
  command.option("-d, --data <json>", "cuerpo JSON extra o @archivo.json (las opciones tienen prioridad)");

  return (opts: Record<string, unknown>) => {
    const body = parseData(opts.data as string | undefined);
    for (const [attribute, key] of bindings) {
      if (opts[attribute] !== undefined) body[key] = opts[attribute];
    }
    return body;
  };
}

export function resourceCommand<T extends Row>(spec: ResourceSpec<T>): Command {
  const msg = messages(spec);
  const cmd = new Command(spec.command).description(spec.description);
  const itemPath = (id: string) => `${spec.path}/${encodeURIComponent(id)}`;

  const list = cmd
    .command("list")
    .alias("ls")
    .description(`Lista ${spec.feminine ? "las" : "los"} ${spec.plural} (paginado)`)
    .option("-p, --page <n>", "página", toInt, 1)
    .option("-n, --page-size <n>", "resultados por página (máx. 100)", toInt, 20)
    .option("-s, --search <text>", "búsqueda por texto")
    .option("-a, --all", "trae todas las páginas");
  const filters = (spec.filters ?? []).map((filter) => {
    const option = new Option(filter.flags, filter.description);
    if (filter.parse) option.argParser(filter.parse);
    list.addOption(option);
    return [option.attributeName(), filter.param] as const;
  });
  list.action(async (opts, command: Command) => {
    const api = clientFor(command);
    const query: Query = { search: opts.search };
    for (const [attribute, param] of filters) query[param] = opts[attribute];
    const result = opts.all
      ? await api.getAll<T>(spec.path, query)
      : await api.get<Paginated<T>>(spec.path, {
          ...query,
          page: opts.page,
          pageSize: opts.pageSize,
        });
    emit(result, () => {
      table(result.data, spec.columns);
      pageFooter(result);
    });
  });

  cmd
    .command("get <id>")
    .alias("show")
    .description(`Muestra ${msg.a}`)
    .action(async (id: string, _opts, command: Command) => {
      const row = await clientFor(command).get<T>(itemPath(id));
      emit(row, () => (spec.detail ? spec.detail(row) : keyValues(row)));
    });

  if (spec.fields) {
    const create = cmd.command("create").description(`Crea ${msg.a}`);
    const createBody = addFields(create, spec.fields, "create");
    create.action(async (opts, command: Command) => {
      const row = await clientFor(command).post<T>(spec.path, createBody(opts));
      emit(row, () => success(`${msg.created}: ${spec.label(row)} ${c.dim(row.id)}`));
    });

    const update = cmd
      .command("update <id>")
      .description(`Actualiza ${msg.a} (solo los campos indicados)`);
    const updateBody = addFields(update, spec.fields, "update");
    update.action(async (id: string, opts, command: Command) => {
      const body = updateBody(opts);
      if (!Object.keys(body).length) {
        throw new CliError("Nada que actualizar", `Indica al menos un campo. Ver: ecom ${spec.command} update --help`);
      }
      const row = await clientFor(command).patch<T>(itemPath(id), body);
      emit(row, () => success(`${msg.updated}: ${spec.label(row)} ${c.dim(row.id)}`));
    });
  }

  cmd
    .command("delete <id>")
    .alias("rm")
    .description(`Elimina ${msg.a}`)
    .option("-y, --yes", "no pide confirmación")
    .action(async (id: string, opts, command: Command) => {
      const api = clientFor(command);
      if (!opts.yes) {
        if (!canPrompt()) throw new CliError("Falta la confirmación", "Usa --yes para eliminar sin preguntar.");
        const row = await api.get<T>(itemPath(id));
        if (!(await confirm(`¿Eliminar ${spec.noun} ${spec.label(row)}?`))) {
          console.log(c.dim("Cancelado."));
          return;
        }
      }
      await api.delete(itemPath(id));
      emit({ ok: true, id }, () => success(`${msg.deleted}: ${id}`));
    });

  return cmd;
}
