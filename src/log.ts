import manifest from "../public/manifest.json";

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
