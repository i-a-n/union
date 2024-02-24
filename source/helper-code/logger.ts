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

  flushLogs() {
    this.logs
      .sort((a, b) => {
        // First, sort by domain
        if ((a.domain ?? "") < (b.domain ?? "")) return -1;
        if ((a.domain ?? "") > (b.domain ?? "")) return 1;

        // If domains are equal or non existent, compare by sequence
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
