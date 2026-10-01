import { createInterface } from "node:readline/promises";
import { CliError } from "./errors.js";

export const canPrompt = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

function requireTty(what: string, hint: string) {
  if (!canPrompt()) throw new CliError(`Falta ${what}`, hint);
}

export async function ask(question: string, hint = "Pásalo como opción."): Promise<string> {
  requireTty(question.replace(/[:?]\s*$/, "").toLowerCase(), hint);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Reads a line without echoing it (passwords). */
export async function askHidden(question: string, hint = "Pásala como opción."): Promise<string> {
  requireTty(question.replace(/[:?]\s*$/, "").toLowerCase(), hint);
  const { stdin, stdout } = process;
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise((resolve) => {
    let value = "";
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          finish();
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    stdin.on("data", onData);
  });
}

/** Without a TTY the caller must pass --yes; there is nobody to ask. */
export async function confirm(question: string): Promise<boolean> {
  requireTty("la confirmación", "Usa --yes para confirmar sin preguntar.");
  const answer = await ask(`${question} (s/N) `);
  return /^(s|si|sí|y|yes)$/i.test(answer);
}
