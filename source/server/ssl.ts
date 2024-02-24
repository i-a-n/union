import fs from "fs";
import path from "path";
import vhttps, { Credential } from "vhttps";
import { Express as ExpressType } from "express";

import { findDomainSubdirectories } from "../helper-code/tree-traversal";
import logger from "../helper-code/logger";

const getCertificateFiles = (
  match: string
): { cert: Credential["cert"]; key: Credential["key"] } => {
  const basePath = path.join(process.cwd(), `./certificates/${match}`);
  let cert;
  let key;

  try {
    cert = fs.readFileSync(path.join(basePath, "fullchain.pem"), "utf8");
  } catch (error: any) {
    console.error(`error reading SSL certificate file for ${match}:`, error);
    cert = "";
  }

  try {
    key = fs.readFileSync(path.join(basePath, "privkey.pem"), "utf8");
  } catch (error: any) {
    console.error(`error reading SSL key file for ${match}:`, error);
    key = "";
  }

  return { cert, key };
};

const configureSSL = (app: ExpressType) => {
  const certificates: Credential[] = [];

  // Loop through directories in `./certificates`, looking for domain names
  const matches = findDomainSubdirectories("./certificates");
  matches.forEach((match) => {
    certificates.push({
      hostname: match,
      ...getCertificateFiles(match),
    });
  });

  logger.log({
    locationInCode: "configureSSL",
    entry: [
      "creating SSL server with these certs: ",
      certificates.map((cert) => cert.hostname),
    ],
  });

  return vhttps.createServer({}, certificates, app);
};

export default configureSSL;
