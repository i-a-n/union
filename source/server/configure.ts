import express, { Express as ExpressAppType } from "express";

const configureTheApp = (): ExpressAppType => {
  const app = express();

  // Example: Serve files from the current directory
  app.use(express.static(process.cwd()));

  return app;
};

export default configureTheApp;
