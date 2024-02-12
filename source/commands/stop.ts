import pm2 from "pm2";

const stopAllProcesses = () => {
  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to pm2:", err);
      process.exit(2);
    }

    pm2.delete("all", (err) => {
      if (err) {
        console.error("Error stopping processes:", err);
      } else {
        console.log("All processes stopped and deleted.");
      }
      pm2.disconnect();
    });
  });
};

export default stopAllProcesses;
