import pm2 from "pm2";

import { formatElapsedTime } from "../helper-code/utilities";

// Function to display the status of all pm2 processes
const showStatus = () => {
  pm2.connect((err) => {
    if (err) {
      console.error("error connecting to daemon manager:", err);
      process.exit(2);
    }

    pm2.list((err, processDescriptionList) => {
      if (err) {
        console.error("error retrieving process list:", err);
        pm2.disconnect();
        process.exit(2);
      }

      console.log("union server status:");
      processDescriptionList.forEach((proc) => {
        console.log(
          `${proc.pm2_env?.status}, process ID: ${
            proc.pid
          }, uptime: ${formatElapsedTime(
            Date.now() - (proc.pm2_env?.pm_uptime ?? 0)
          )}`
        );
      });

      pm2.disconnect(); // Always disconnect after finishing
    });
  });
};

export default showStatus;
