"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDomain = exports.isDirectoryOrSymlinkDirectory = exports.formatElapsedTime = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Helper function to format milliseconds into human-readable format
const formatElapsedTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
};
exports.formatElapsedTime = formatElapsedTime;
/*
 * Helper function to determine whether an entry is either 1) a directory or 2) a symlink that points
 * to a directory
 */
const isDirectoryOrSymlinkDirectory = (parentDirectoryPath, entry) => {
    if (entry.isDirectory()) {
        return true; // Directly a directory
    }
    else if (entry.isSymbolicLink()) {
        // Resolve symlink and check if it's a directory
        const resolvedPath = path_1.default.join(parentDirectoryPath, entry.name);
        const fileOrDirectory = fs_1.default.statSync(resolvedPath);
        if (fileOrDirectory.isDirectory()) {
            return true; // Symlink pointing to a directory
        }
    }
    return false;
};
exports.isDirectoryOrSymlinkDirectory = isDirectoryOrSymlinkDirectory;
// Function to check if a directory name is a valid domain/subdomain
const isValidDomain = (name) => {
    const domainRegex = 
    /*
     * (?!      )                                                             Can't start with...
     *    :\/\/                                                               "://" (ignores stuff like http://).
     *          (                )*                                           Optional subdomain(s)...
     *           [a-zA-Z0-9-_]+                                               Must start with letter, digit, hyphen, or
     *                                                                          underscore...
     *                         \.                                             Followed by a dot.
     *                             [a-zA-Z0-9]                                Main domain must start with letter or
     *                                                                          digit.
     *                                        [a-zA-Z0-9-_]+                  Main part of the domain: letters, digits,
     *                                                                          hyphens, underscores.
     *                                                      \.                Dot before the TLD.
     *                                                        [a-zA-Z]{2,11}? TLD: 2 to 11 letters (lazily matched).
     */
    /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
    return domainRegex.test(name);
};
exports.isValidDomain = isValidDomain;
