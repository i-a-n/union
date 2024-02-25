"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFilesRecursive = exports.findSingleFile = exports.findDomainSubdirectories = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utilities_1 = require("./utilities");
/*
 * Synchronous function to find direct child directories of `pathToCheck` that are also
 * valid domain names.
 */
const findDomainSubdirectories = (pathToCheck = ".") => {
    const fullPath = path.join(process.cwd(), pathToCheck);
    try {
        const entries = fs.readdirSync(fullPath, {
            withFileTypes: true,
        });
        /*
         * Note that this isn't recursive. We're only looking for direct child subdirectories
         * that are domain names, not grandchild and great-great-great-greatgrandchild dirs.
         */
        return entries
            .filter((entry) => (0, utilities_1.isDirectoryOrSymlinkDirectory)(fullPath, entry) &&
            (0, utilities_1.isValidDomain)(entry.name))
            .map((entry) => entry.name);
    }
    catch (error) {
        console.log(`error reading subdirectories of ${pathToCheck}`);
        return [];
    }
};
exports.findDomainSubdirectories = findDomainSubdirectories;
// Synchronous function to find a single file in a single directory. Not recursive.
const findSingleFile = (pathToCheck, filename) => {
    try {
        const files = fs.readdirSync(pathToCheck);
        for (const file of files) {
            if (file === filename) {
                return path.join(pathToCheck, filename);
            }
        }
    }
    catch (error) {
        console.error(`error searching directory (${pathToCheck}):`, error);
    }
    return null;
};
exports.findSingleFile = findSingleFile;
/*
 * Recursively search for a file in a directory and its subdirectories. This is done async.
 * Returns an array of paths to matching filenames. If none are found, returns [].
 */
async function findFilesRecursive(pathToTraverse, filename) {
    const foundPaths = [];
    async function traverse(currentPath) {
        const entries = await fs.promises.readdir(currentPath, {
            withFileTypes: true,
        });
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if ((0, utilities_1.isDirectoryOrSymlinkDirectory)(currentPath, entry)) {
                // If the entry is a directory, recursively search it
                await traverse(fullPath);
            }
            else if (entry.isFile() && entry.name === filename) {
                // If the entry is a file and matches the filename, add it to the results
                foundPaths.push(fullPath);
            }
        }
    }
    await traverse(pathToTraverse); // Start the recursive search
    return foundPaths;
}
exports.findFilesRecursive = findFilesRecursive;
