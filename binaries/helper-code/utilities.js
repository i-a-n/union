"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettyMs = void 0;
// Helper function to format milliseconds into human-readable format
const prettyMs = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
};
exports.prettyMs = prettyMs;
