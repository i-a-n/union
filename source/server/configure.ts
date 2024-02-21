import auth from "basic-auth";
import connect from "connect";
import express, { Express as ExpressAppType } from "express";
import fs from "fs";
import path from "path";
import serveStatic from "serve-static";
import vhost from "vhost";

import { isDirectoryOrSymlinkDirectory } from "../helper-code/utilities";
import {
  findDomainSubdirectories,
  findFilesRecursive,
  findSingleFile,
} from "../helper-code/tree-traversal";
import errorPageHTML from "../html/404";

// Synchronous function to check for the existence of a direct-child 'html' directory
const containsHtmlDirectory = (pathToDirectory: string): boolean => {
  try {
    const filesAndFoldersToCheck = fs.readdirSync(pathToDirectory, {
      withFileTypes: true,
    });
    for (const fileOrFolder of filesAndFoldersToCheck) {
      if (
        fileOrFolder.name === "html" &&
        isDirectoryOrSymlinkDirectory(pathToDirectory, fileOrFolder)
      ) {
        return true;
      }
    }
    return false; // No html directory or symlink pointing to a directory found
  } catch (error) {
    console.error("error checking for ./html directory:", error);
    return false;
  }
};

/*
 * Core logic of this whole library, arguably. Should return a full express() app, ready to be
 * served via http.
 */
const configureHttpServer = async (): Promise<express.Express> => {
  const app = express();

  // Loop through candidate subdirectories and configure each one into `app`
  const matches = findDomainSubdirectories();

  await Promise.all(
    matches.map(async (match) => {
      let pathToDomain = path.join(process.cwd(), match);

      /*
       * We need to use the Express-developed "connect()" middleware thing. See:
       * https://www.npmjs.com/package/connect
       */
      const domainSpecificMiddleware = connect();

      // Search for .config files
      const pathToConfigFile = findSingleFile(pathToDomain, ".union.config.js");

      if (pathToConfigFile && fs.existsSync(pathToConfigFile)) {
        // Process config file
        try {
          // Dynamically import the config file's exported app
          const importedConfig = await import(pathToConfigFile);
          const customAppConfig = importedConfig.default; // Using default export

          // Use the imported app as middleware
          domainSpecificMiddleware.use(customAppConfig);
        } catch (error) {
          console.error("error importing config file:", error);
        }
      }

      /*
       * Each domain needs to `use()` its own static path. Using the `serve-static`
       * library here because, once again, Express said so:
       * https://www.npmjs.com/package/serve-static
       */
      if (containsHtmlDirectory(pathToDomain)) {
        pathToDomain = path.join(pathToDomain, "html");
      }

      // Search for .do-not-serve & .union-password files
      Promise.all([
        findFilesRecursive(pathToDomain, ".do-not-serve"),
        findFilesRecursive(pathToDomain, ".union-password"),
      ])
        .then((results) => {
          // results is an array containing the results of each promise in the order they were in the array
          const directoriesNotToServe = results[0];
          const directoriesToPasswordProtect = results[1];

          console.log({ directoriesNotToServe });
          console.log({ directoriesToPasswordProtect });

          directoriesNotToServe.forEach((pathToDoNotServeFile) => {
            // Extract the relative path of the directory containing the .do-not-serve file
            const relativePath = path.relative(
              pathToDomain,
              path.dirname(pathToDoNotServeFile)
            );

            const routePath = `/${relativePath}/*`; // Format correctly for Express

            // Configure middleware to skip serving this path
            app.use(routePath, (req, res, next) => {
              console.log("pwd");
              return res.status(404).send(errorPageHTML);
            });

            console.log(`configured to not serve: ${routePath}`);
          });

          directoriesToPasswordProtect.forEach((pathToPasswordFile) => {
            // Read and parse the .union-password file to get credentials
            const passwordContent = fs.readFileSync(pathToPasswordFile, "utf8");
            const credentialsArray = passwordContent
              .trim()
              .split("\n")
              .map((line) => {
                const [name, pass] = line.split(":");
                return { name, pass };
              });

            // Extract the relative path of the directory containing the password file
            const relativePath = path.relative(
              pathToDomain,
              path.dirname(pathToPasswordFile)
            );

            const routePath = `/${relativePath}`; // Format correctly for Express

            // Configure middleware to not serve the password file
            app.all(`${routePath}/.union-password`, (req, res, next) =>
              res.status(404).send(errorPageHTML)
            );

            // Configure middleware to password protect the parent directory and all child directories
            app.all(`${routePath}/*`, (req, res, next) => {
              const user = auth(req);

              // Check if the user is authenticated
              const isAuthenticated = credentialsArray.some((credential) => {
                return (
                  user &&
                  user.name === credential.name &&
                  user.pass === credential.pass
                );
              });

              if (!isAuthenticated) {
                res.set("WWW-Authenticate", `Basic realm="Protected Area"`);
                return res.status(401).send("Unauthorized");
              }

              next(); // User is authenticated, proceed to next middleware or route handler
            });

            console.log(`Configured to password protect: ${routePath}`);
          });
        })
        .catch((error) => {
          // If any of the promises rejects, this catch block is executed
          console.error("an error occurred configuring the domain:", error);
        })
        .finally(() => {
          // Serve the domain.
          // TODO: Maybe turn this off if config file is specified?
          // if (!pathToConfigFile) { ...
          domainSpecificMiddleware.use("/", serveStatic(pathToDomain));

          /*
           * Use the Express-developed "vhost" to create a virtual host for this domain-specific middleware we
           * just configured: https://www.npmjs.com/package/vhost
           */
          app.use(vhost(match, domainSpecificMiddleware));
        });
    })
  );

  return app;
};

export default configureHttpServer;
