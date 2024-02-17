declare module "vhttps" {
  import { Server as HTTPSServer, ServerOptions } from "https";

  interface Credential {
    hostname: string;
    key: string;
    cert: string;
    ca?: string;
  }

  interface VHttpsOptions extends ServerOptions {}

  export function createServer(
    opts: VHttpsOptions,
    creds: Credential[],
    requestListener?: any
  ): HTTPSServer;
}
