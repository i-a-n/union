"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const configureTheApp = () => {
    const app = (0, express_1.default)();
    // Example: Serve files from the current directory
    app.use(express_1.default.static(process.cwd()));
    return app;
};
exports.default = configureTheApp;
