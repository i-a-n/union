import pm2 from "pm2";
import { prettyMs } from "../helper-code/utilities";

// Function to display the status of all pm2 processes
const showStatus = () => {
  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to pm2:", err);
      process.exit(2);
    }

    pm2.list((err, processDescriptionList) => {
      if (err) {
        console.error("Error retrieving pm2 process list:", err);
        pm2.disconnect();
        process.exit(2);
      }

      console.log("PM2 Processes Status:");
      processDescriptionList.forEach((proc) => {
        console.log(
          `Status: ${proc.pm2_env?.status}, PID: ${
            proc.pid
          }, Uptime: ${prettyMs(Date.now() - (proc.pm2_env?.pm_uptime ?? 0))}`
        );
      });

      pm2.disconnect(); // Always disconnect after finishing
    });
  });
};

export default showStatus;
