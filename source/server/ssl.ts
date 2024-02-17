import fs from "fs";
import path from "path";
import vhttps, { Credential } from "vhttps";
import { Express as ExpressType } from "express";

import { findDomainSubdirectories } from "../helper-code/utilities";

const getCertificateFiles = (
  match: string
): { cert: Credential["cert"]; key: Credential["key"] } => {
  const basePath = path.join(process.cwd(), `./certificates/${match}`);
  let cert;
  let key;

  try {
    cert = fs.readFileSync(path.join(basePath, "fullchain.pem"), "utf8");
  } catch (error: any) {
    console.error(`Error reading certificate file for ${match}:`, error);
    cert = "";
  }

  try {
    key = fs.readFileSync(path.join(basePath, "privkey.pem"), "utf8");
  } catch (error: any) {
    console.error(`Error reading key file for ${match}:`, error);
    key = "";
  }

  return { cert, key };
};

const configureSSL = (app: ExpressType) => {
  const certificates: Credential[] = [];

  // Loop through directories in `./certificates`, looking for domain names
  findDomainSubdirectories("./certificates")
    .then((matches) => {
      console.log("found the following SSL pointers: ", matches);
      matches.forEach((match) => {
        certificates.push({
          hostname: match,
          ...getCertificateFiles(match),
        });
      });
    })
    .catch((err) => {
      console.log(
        "Error in configureSSL, likely no certificates directory:",
        err
      );
    });

  return vhttps.createServer({}, certificates, app);
};

export default configureSSL;