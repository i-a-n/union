import * as fs from "fs";
import * as path from "path";

import { isDirectoryOrSymlinkDirectory, isValidDomain } from "./utilities";
import logger from "./logger";

/*
 * Synchronous function to find direct child directories of `pathToCheck` that are also
 * valid domain names.
 */
export const findDomainSubdirectories = (
  pathToCheck: string = "."
): string[] => {
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
      .filter(
        (entry) =>
          isDirectoryOrSymlinkDirectory(fullPath, entry) &&
          isValidDomain(entry.name)
      )
      .map((entry) => {
        logger.log({
          locationInCode: "findDomainSubdirectories",
          entry: `found directory that looks like a domain name: ${entry.name}`,
        });
        return entry.name;
      });
  } catch (error) {
    console.log(`error reading subdirectories of ${pathToCheck}`);
    return [];
  }
};

// Synchronous function to find a single file in a single directory. Not recursive.
export const findSingleFile = (
  pathToCheck: string,
  filename: string
): string | null => {
  try {
    const files = fs.readdirSync(pathToCheck);
    for (const file of files) {
      if (file === filename) {
        return path.join(pathToCheck, filename);
      }
    }
  } catch (error) {
    console.error(`error searching directory (${pathToCheck}):`, error);
  }
  return null;
};

/*
 * Recursively search for a file in a directory and its subdirectories. This is done async.
 * Returns an array of paths to matching filenames. If none are found, returns [].
 */
export async function findFilesRecursive(
  pathToTraverse: string,
  filename: string
): Promise<string[]> {
  const foundPaths: string[] = [];

  async function traverse(currentPath: string) {
    const entries = await fs.promises.readdir(currentPath, {
      withFileTypes: true,
    });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (isDirectoryOrSymlinkDirectory(currentPath, entry)) {
        // If the entry is a directory, recursively search it
        await traverse(fullPath);
      } else if (entry.isFile() && entry.name === filename) {
        // If the entry is a file and matches the filename, add it to the results
        foundPaths.push(fullPath);
      }
    }
  }

  await traverse(pathToTraverse); // Start the recursive search
  return foundPaths;
}
