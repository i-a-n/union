import connect from "connect";
import express, { Express as ExpressAppType } from "express";
import fs from "fs";
import path from "path";
import serveStatic from "serve-static";
import vhost from "vhost";

import { findDomainSubdirectories } from "../helper-code/utilities";

// Synchronous function to check for the existence of a direct-child 'html' directory
function containsHtmlDirectory(pathToDirectory: string): boolean {
  try {
    const entries = fs.readdirSync(pathToDirectory, { withFileTypes: true });
    for (const dirent of entries) {
      if (dirent.name === "html") {
        if (dirent.isDirectory()) {
          return true; // Directly a directory
        } else if (dirent.isSymbolicLink()) {
          // Resolve symlink and check if it's a directory
          const resolvedPath = path.join(pathToDirectory, dirent.name);
          const stats = fs.statSync(resolvedPath);
          if (stats.isDirectory()) {
            return true; // Symlink pointing to a directory
          }
        }
      }
    }
    return false; // No html directory or symlink pointing to a directory found
  } catch (error) {
    console.error("Error checking for html directory:", error);
    return false;
  }
}

/*
 * Core logic of this whole library, arguably. Should return a full express() app, ready to be
 * served via http.
 */
const configureTheApp = (): ExpressAppType => {
  const app = express();

  // Loop through candidate subdirectories and configure each one into `app`
  const matches = findDomainSubdirectories();

  matches.forEach((match) => {
    const pathToDirectory = path.join(process.cwd(), match);
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
    if (containsHtmlDirectory(pathToDirectory)) {
      domainSpecificMiddleware.use(
        "/",
        serveStatic(path.join(pathToDirectory, "html"))
      );
    } else {
      domainSpecificMiddleware.use("/", serveStatic(pathToDirectory));
    }

    /*
     * And then, you guessed it, we use the Express-developed "vhost" to create a virtual
     * host for this domain-specific middleware we just configured:
     * https://www.npmjs.com/package/vhost
     */
    app.use(vhost(match, domainSpecificMiddleware));
  });

  return app;
};

export default configureTheApp;
