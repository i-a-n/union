"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pm2_1 = __importDefault(require("pm2"));
const utilities_1 = require("../helper-code/utilities");
// Function to display the status of all pm2 processes
const showStatus = () => {
    pm2_1.default.connect((err) => {
        if (err) {
            console.error("error connecting to daemon manager:", err);
            process.exit(2);
        }
        pm2_1.default.list((err, processDescriptionList) => {
            if (err) {
                console.error("error retrieving process list:", err);
                pm2_1.default.disconnect();
                process.exit(2);
            }
            console.log("union servers:");
            processDescriptionList.forEach((proc) => {
                var _a, _b, _c;
                console.log(`status: ${(_a = proc.pm2_env) === null || _a === void 0 ? void 0 : _a.status}, process ID: ${proc.pid}, uptime: ${(0, utilities_1.formatElapsedTime)(Date.now() - ((_c = (_b = proc.pm2_env) === null || _b === void 0 ? void 0 : _b.pm_uptime) !== null && _c !== void 0 ? _c : 0))}`);
            });
            pm2_1.default.disconnect(); // Always disconnect after finishing
        });
    });
};
exports.default = showStatus;
