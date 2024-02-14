#!/usr/bin/env node

import pm2 from "pm2";

import configureTheApp from "./server/configure";
import showStatus from "./commands/status";
import stopAllProcesses from "./commands/stop";

const DEFAULT_HTTP_PORT = /* 80 */ 3000;

// Check if it's the child process
function isChildProcess() {
  return process.env.CHILD_PROCESS === "true";
}

// Main logic to handle command-line arguments
const args = process.argv.slice(2); // Remove "node" and script name

switch (args[0]) {
  case "status":
    showStatus();
    break;
  case "stop":
    stopAllProcesses();
    break;
  default:
    /**
     * The magic happens in this if-statement. If we are currently in a CHILD_PROCESS,
     * we should run an express server. The trick is, if we are NOT in a CHILD_PROCESS,
     * we need to call this very script using pm2, with env.CHILD_PROCESS = true. That
     * way the script will be "re-run" and daemonized by pm2, but on the second run it
     * will just run an express server! That way with one command, in one file, you can
     * both instantiate a pm2 daemon AND have it call a dynamically-configured server.
     */
    if (isChildProcess()) {
      const httpApp = configureTheApp();
      const httpPort = args[1] || DEFAULT_HTTP_PORT;
      httpApp.listen(httpPort);
    } else {
      pm2.connect((err: Error) => {
        if (err) {
          console.error("Error connecting to pm2:", err);
          process.exit(2);
        }

        pm2.start(
          {
            script: __filename,
            exec_mode: "fork",
            instances: 1,
            name: "union",
            env: {
              CHILD_PROCESS: "true",
            },
          },
          (err, apps) => {
            pm2.disconnect(); // Disconnect after starting
            if (err) throw err;
          }
        );
      });
    }
}
