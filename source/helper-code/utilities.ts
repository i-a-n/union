import path from "path";
import fs from "fs";

// Helper function to format milliseconds into human-readable format
export const prettyMs = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
};

/*
 * Helper function to determine whether an entry is either 1) a directory or 2) a symlink that points
 * to a directory
 */
export const isDirectoryOrSymlinkDirectory = (
  parentDirectoryPath: string,
  entry: fs.Dirent
): boolean => {
  if (entry.isDirectory()) {
    return true; // Directly a directory
  } else if (entry.isSymbolicLink()) {
    // Resolve symlink and check if it's a directory
    const resolvedPath = path.join(parentDirectoryPath, entry.name);
    const fileOrDirectory = fs.statSync(resolvedPath);
    if (fileOrDirectory.isDirectory()) {
      return true; // Symlink pointing to a directory
    }
  }
  return false;
};

// Function to check if a directory name is a valid domain/subdomain
export const isValidDomain = (name: string): boolean => {
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

/*
 * Async function to find subdirectories matching domain name pattern. Honestly
 * not too sure whether async is right here. I think we could use a `syncReaddr`
 * or something like that instead of `fs.promises.readdir`, if we start seeing
 * odd filesystem bugs, to make it synchronous. That could simplify things and
 * I'm sure the speed difference is negligible.
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
      .map((entry) => entry.name);
  } catch (error) {
    console.log("Error reading subdirectories");
    return [];
  }
};
