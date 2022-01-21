import manifest from "../public/manifest.json";

// development only debug logs
// To see the debug logs, set the log level to debug or verbose in the devtools console.
export function debug(message: string, ...args: ReadonlyArray<unknown>) {
    if (process.env.NODE_ENV !== "production") {
        console.debug(`[${manifest.name}] ${message}`, ...args);
    }
}

export function info(message: string, ...args: ReadonlyArray<unknown>) {
    if (process.env.NODE_ENV !== "production") {
        console.info(`[${manifest.name}] ${message}`, ...args);
    }
}

export function warn(message: string, ...args: ReadonlyArray<unknown>) {
    console.warn(`[${manifest.name}] ${message}`, ...args);
}
