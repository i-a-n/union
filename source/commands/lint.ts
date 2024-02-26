import logger from "../helper-code/logger";
import configureHttpServer from "../server/configure";
import configureSSL from "../server/ssl";
import { DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT } from "../union";

const tryToStartServer = (server: any, httpOrHttps: string, port: number) =>
  new Promise<void>((resolve) => {
    const serverInstance = server
      .listen(port, () => {
        logger.log({
          locationInCode: "server startup",
          entry: `SUCCESS - union can start your ${httpOrHttps} server on port ${port}`,
        });
        serverInstance.close(() => {
          resolve();
        });
      })
      .on("error", (err: any) => {
        if (err.code === "EACCES") {
          logger.log({
            locationInCode: "server startup",
            entry: `you cannot open a server on port ${port} as this user. run 'npx union help permissions' for more info.`,
          });
        } else if (err.code === "EADDRINUSE") {
          logger.log({
            locationInCode: "server startup",
            entry: `unable to open the ${httpOrHttps} server on port ${port} ... it's already in use!`,
          });
        } else {
          logger.log({
            locationInCode: "server startup",
            entry: `failed to start the ${httpOrHttps} server on port ${port}: ${err.message}`,
          });
        }
        resolve();
      });
  });

const lint = () => {
  configureHttpServer()
    .then((httpApp) => {
      const httpPort = DEFAULT_HTTP_PORT;

      const httpsApp = configureSSL(httpApp);
      const httpsPort = DEFAULT_HTTPS_PORT;

      return Promise.allSettled([
        tryToStartServer(httpApp, "http", httpPort),
        tryToStartServer(httpsApp, "https", httpsPort),
      ]);
    })
    .catch((error) => console.error("fatal error configuring app: ", error))
    .finally(() => {
      logger.flushLogs();
    });
};

export default lint;
