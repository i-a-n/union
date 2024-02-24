"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Since the config and server startup functions are a big mix of sync/async, the logging often
 * gets weird, so this helper class will store the logs during execution, then flush them to
 * console.log() on demand, all nice and sorted
 */
class Logger {
    constructor() {
        this.logs = [];
        this.sequence = 0;
    }
    log(logEntry) {
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
            var _a, _b, _c, _d;
            // First, sort by domain
            if (((_a = a.domain) !== null && _a !== void 0 ? _a : "") < ((_b = b.domain) !== null && _b !== void 0 ? _b : ""))
                return -1;
            if (((_c = a.domain) !== null && _c !== void 0 ? _c : "") > ((_d = b.domain) !== null && _d !== void 0 ? _d : ""))
                return 1;
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
exports.default = logger;
