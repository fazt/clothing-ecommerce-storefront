import type { Command } from "commander";
import { ApiClient } from "./client.js";
import { config } from "./config.js";

export function apiUrlFor(cmd: Command): string {
  return config.apiUrl(cmd.optsWithGlobals().api);
}

/** Client for the selected API, signed with ECOM_TOKEN or the saved session. */
export function clientFor(cmd: Command): ApiClient {
  const apiUrl = apiUrlFor(cmd);
  const token = process.env.ECOM_TOKEN || config.session(apiUrl)?.token;
  return new ApiClient(apiUrl, token);
}
