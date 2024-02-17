"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vhttps_1 = __importDefault(require("vhttps"));
const utilities_1 = require("../helper-code/utilities");
const getCertificateFiles = (match) => {
    const basePath = path_1.default.join(process.cwd(), `./certificates/${match}`);
    let cert;
    let key;
    try {
        cert = fs_1.default.readFileSync(path_1.default.join(basePath, "fullchain.pem"), "utf8");
    }
    catch (error) {
        console.error(`Error reading certificate file for ${match}:`, error);
        cert = "";
    }
    try {
        key = fs_1.default.readFileSync(path_1.default.join(basePath, "privkey.pem"), "utf8");
    }
    catch (error) {
        console.error(`Error reading key file for ${match}:`, error);
        key = "";
    }
    return { cert, key };
};
const configureSSL = (app) => {
    const certificates = [];
    // Loop through directories in `./certificates`, looking for domain names
    (0, utilities_1.findDomainSubdirectories)("./certificates")
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
        console.log("Error in configureSSL, likely no certificates directory:", err);
    });
    return vhttps_1.default.createServer({}, certificates, app);
};
exports.default = configureSSL;
