interface UnionLogEntry {
  // if true, only log when we're in debug mode
  debugModeOnly?: boolean;

  // if we're configuring within a domain, this should be the domain name
  domain?: string;

  // whatever needs to get logged
  entry: any;

  // arbitrary description of where the log came from
  locationInCode: string;

  // auto-incremented sequence number, helpful for sorting async stuff
  sequence: number;
}

const SORT_ME_LAST_UNICODE = "\uFFFF";

/*
 * Since the config and server startup functions are a big mix of sync/async, the logging often
 * gets weird, so this helper class will store the logs during execution, then flush them to
 * console.log() on demand, all nice and sorted
 */
class Logger {
  logs: UnionLogEntry[];
  sequence: number;

  constructor() {
    this.logs = [];
    this.sequence = 0;
  }

  log(logEntry: Omit<UnionLogEntry, "sequence">) {
    // don't log debug-only entries if we aren't in debug mode
    if (logEntry.debugModeOnly && !process.env.DEBUG) {
      return;
    }

    // otherwise increment the sequence and store the entry
    const seq = this.sequence++;
    this.logs.push({ sequence: seq, ...logEntry });
  }

  // we only want to print some things during startup (not during lint)
  printDuringStartup(entry: any) {
    // CHILD_PROCESS is only true during startup
    if (process.env.CHILD_PROCESS) {
      console.log(entry);
    }
  }

  flushLogs() {
    this.logs
      .sort((a, b) => {
        /*
         * Sorting the logs can be a bit tricky. We want to sort all the log messages by the domain
         * name that threw the log.. but many logs are thrown without a specific domain name
         * attached. We can sort those too of course, but we always want them to come at the very
         * end of the logs, because in practice it makes way more sense to read them this way.
         * So the best way I found to do that, maybe it's hacky, but if a domain isn't there we
         * sort that log as if it were the very last unicode character, so no domain name could
         * ever come after it. Yes, we could probably do an extra if statement and just return
         * `1`, but this felt like the most intuitive way to implement and talk about this concept.
         */
        if (
          (a.domain ?? SORT_ME_LAST_UNICODE) <
          (b.domain ?? SORT_ME_LAST_UNICODE)
        )
          return -1;
        if (
          (a.domain ?? SORT_ME_LAST_UNICODE) >
          (b.domain ?? SORT_ME_LAST_UNICODE)
        )
          return 1;

        // If domains are equal (or both non existent), compare by sequence
        return a.sequence - b.sequence;
      })
      .forEach((log) => {
        const domain = log.domain ? `[${log.domain.toUpperCase()}] ` : "";
        return console.log(`${domain}${log.locationInCode} - `, log.entry);
      });
  }
}

// Create a single instance of the logger
const logger = new Logger();

// Export the instance
export default logger;
