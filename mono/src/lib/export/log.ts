import { writable } from "svelte/store"

import { Log, type Payload } from "@lv00/toolkit/web"
const { Logger, Transporter, Level, Console } = Log;

export { Level };
export const errors = writable<Payload[]>([])


class SvelteError extends Transporter {
    send(log: Payload): void {
        errors.update((prev) => [log, ...prev])
        setTimeout(() => {
            errors.update((prev) => prev.filter((e) => e !== log));
        }, 5000);
    }

}

const levels = [Level.ERROR, Level.WARN, Level.INFO, Level.OK];
const { DEV } = import.meta.env;

const svelte = new SvelteError({ l: [...levels, ...(DEV ? [Level.DEBUG] : [])] });
const consoleT = new Console();

const logger = new Logger({ t: [svelte, ...(DEV ? [consoleT] : [])] })
export default logger;