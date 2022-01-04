import manifest from "../public/manifest.json";

export function info(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV !== "production") {
        console.log(`[${manifest.name}] ${message}`, ...args);
    }
}

export function warn(message: string, ...args: unknown[]) {
    console.warn(`[${manifest.name}] ${message}`, ...args);
}
