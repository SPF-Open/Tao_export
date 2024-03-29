import { Log, type Payload } from "@lv00/toolkit"
import { writable } from "svelte/store"

export const errors = writable<Payload[]>([])

class SvelteError extends Log.Transporter {
    send(log: Payload): void {
        errors.update((prev) => [log, ...prev])
        setTimeout(() => {
            errors.update((prev) => prev.filter((e) => e !== log));
        }, 5000);
    }
}

export const Level = Log.Level;
const levels = [Level.ERROR, Level.WARN, Level.INFO, Level.OK];
const dev = process.env.NODE_ENV === "development";

const svelte = new SvelteError({ l: [...levels, ...(dev ? [Level.DEBUG] : [])] });
const console = new Log.Console();

const logger = new Log.Logger({ t: [svelte, ...(dev ? [console] : [])] })
export default logger;