"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pm2_1 = __importDefault(require("pm2"));
const stopAllProcesses = () => {
    pm2_1.default.connect((err) => {
        if (err) {
            console.error("error connecting to daemon manager:", err);
            process.exit(2);
        }
        pm2_1.default.delete("all", (err) => {
            if (err) {
                console.error("error stopping processes:", err);
            }
            else {
                console.log("all processes stopped and deleted.");
            }
            pm2_1.default.disconnect();
        });
    });
};
exports.default = stopAllProcesses;
