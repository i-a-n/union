import connect from "connect";
import express, { Express as ExpressAppType } from "express";
import fs from "fs";
import path from "path";
import serveStatic from "serve-static";
import vhost from "vhost";

import { isValidDomain } from "../helper-code/utilities";

/*
 * Async function to find subdirectories matching domain name pattern. Honestly
 * not too sure whether async is right here. I think we could use a `syncReaddr`
 * or something like that instead of `fs.promises.readdir`, if we start seeing
 * odd filesystem bugs, to make it synchronous. That could simplify things and
 * I'm sure the speed difference is negligible.
 */
const findDomainSubdirectories = async (): Promise<string[]> => {
  const currentDir = process.cwd();
  const entries = await fs.promises.readdir(currentDir, {
    withFileTypes: true,
  });
  /*
   * Note that this isn't recursive. We're only looking for direct child subdirectories
   * that are domain names, not grandchild and great-great-great-greatgrandchild dirs.
   */
  const directories = entries
    .filter((entry) => entry.isDirectory() && isValidDomain(entry.name))
    .map((entry) => entry.name);
  return directories;
};

/*
 * Core logic of this whole library, arguably. Should return a full express() app, ready to be
 * served via http.
 */
const configureTheApp = (): ExpressAppType => {
  const app = express();

  // Loop through candidate subdirectories and configure each one into `app`
  findDomainSubdirectories()
    .then((matches) => {
      /*
       * For each valid domain subdirectory, configure it. This part will need to get much more
       * sophisticated eventually. For now, just static serving.
       */
      matches.forEach((match) => {
        /*
         * We need to use the Express-developed "connect()" middleware thing. See:
         * https://www.npmjs.com/package/connect
         */
        const domainSpecificMiddleware = connect();

        /*
         * Now each domain needs to `use()` its own static path. Using the `serve-static`
         * library here because, once again, Express said so:
         * https://www.npmjs.com/package/serve-static
         */
        domainSpecificMiddleware.use(
          "/",
          serveStatic(path.join(process.cwd(), match))
        );

        /*
         * And then, you guessed it, we use the Express-developed "vhost" to create a virtual
         * host for this domain-specific middleware we just configured:
         * https://www.npmjs.com/package/vhost
         */
        app.use(vhost(match, domainSpecificMiddleware));
      });
    })
    .catch((err) => {
      // Note that I'm afraid this error gets eaten by the pm2 parent process.
      // TODO: make it not do that!
      console.error("Error:", err);
    });

  return app;
};

export default configureTheApp;
