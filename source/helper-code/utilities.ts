// Helper function to format milliseconds into human-readable format
export const prettyMs = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
};

// Function to check if a directory name is a valid domain/subdomain
export const isValidDomain = (name: string): boolean => {
  const domainRegex =
    //(?!      )                                                             Can't start with...
    //   :\/\/                                                               "://" (ignores stuff like http://).
    //         (                )*                                           Optional subdomain(s)...
    //          [a-zA-Z0-9-_]+                                               Must start with letter, digit, hyphen, or
    //                                                                         underscore...
    //                        \.                                             Followed by a dot.
    //                            [a-zA-Z0-9]                                Main domain must start with letter or
    //                                                                         digit.
    //                                       [a-zA-Z0-9-_]+                  Main part of the domain: letters, digits,
    //                                                                         hyphens, underscores.
    //                                                     \.                Dot before the TLD.
    //                                                       [a-zA-Z]{2,11}? TLD: 2 to 11 letters (lazily matched).
    /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
  return domainRegex.test(name);
};
