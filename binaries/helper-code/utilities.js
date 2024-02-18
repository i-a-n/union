"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDomainSubdirectories = exports.isValidDomain = exports.isDirectoryOrSymlinkDirectory = exports.prettyMs = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Helper function to format milliseconds into human-readable format
const prettyMs = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
};
exports.prettyMs = prettyMs;
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
/*
 * Async function to find subdirectories matching domain name pattern. Honestly
 * not too sure whether async is right here. I think we could use a `syncReaddr`
 * or something like that instead of `fs.promises.readdir`, if we start seeing
 * odd filesystem bugs, to make it synchronous. That could simplify things and
 * I'm sure the speed difference is negligible.
 */
const findDomainSubdirectories = (pathToCheck = ".") => {
    const fullPath = path_1.default.join(process.cwd(), pathToCheck);
    try {
        const entries = fs_1.default.readdirSync(fullPath, {
            withFileTypes: true,
        });
        /*
         * Note that this isn't recursive. We're only looking for direct child subdirectories
         * that are domain names, not grandchild and great-great-great-greatgrandchild dirs.
         */
        return entries
            .filter((entry) => (0, exports.isDirectoryOrSymlinkDirectory)(fullPath, entry) &&
            (0, exports.isValidDomain)(entry.name))
            .map((entry) => entry.name);
    }
    catch (error) {
        console.log("Error reading subdirectories");
        return [];
    }
};
exports.findDomainSubdirectories = findDomainSubdirectories;
