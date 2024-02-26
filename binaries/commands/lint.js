"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../helper-code/logger"));
const configure_1 = __importDefault(require("../server/configure"));
const ssl_1 = __importDefault(require("../server/ssl"));
const union_1 = require("../union");
const tryToStartServer = (server, httpOrHttps, port) => new Promise((resolve) => {
    const serverInstance = server
        .listen(port, () => {
        logger_1.default.log({
            locationInCode: "server startup",
            entry: `SUCCESS - union can start your ${httpOrHttps} server on port ${port}`,
        });
        serverInstance.close(() => {
            resolve();
        });
    })
        .on("error", (err) => {
        if (err.code === "EACCES") {
            logger_1.default.log({
                locationInCode: "server startup",
                entry: `you cannot open a server on port ${port} as this user. run 'npx union help permissions' for more info.`,
            });
        }
        else if (err.code === "EADDRINUSE") {
            logger_1.default.log({
                locationInCode: "server startup",
                entry: `unable to open the ${httpOrHttps} server on port ${port} ... it's already in use!`,
            });
        }
        else {
            logger_1.default.log({
                locationInCode: "server startup",
                entry: `failed to start the ${httpOrHttps} server on port ${port}: ${err.message}`,
            });
        }
        resolve();
    });
});
const lint = () => {
    (0, configure_1.default)()
        .then((httpApp) => {
        const httpPort = union_1.DEFAULT_HTTP_PORT;
        const httpsApp = (0, ssl_1.default)(httpApp);
        const httpsPort = union_1.DEFAULT_HTTPS_PORT;
        return Promise.allSettled([
            tryToStartServer(httpApp, "http", httpPort),
            tryToStartServer(httpsApp, "https", httpsPort),
        ]);
    })
        .catch((error) => console.error("fatal error configuring app: ", error))
        .finally(() => {
        logger_1.default.flushLogs();
    });
};
exports.default = lint;
