import pm2 from "pm2";

const stopAllProcesses = () => {
  pm2.connect((err) => {
    if (err) {
      console.error("error connecting to daemon manager:", err);
      process.exit(2);
    }

    pm2.delete("all", (err) => {
      if (err) {
        console.error("error stopping processes:", err);
      } else {
        console.log("all processes stopped and deleted.");
      }
      pm2.disconnect();
    });
  });
};

export default stopAllProcesses;
