import { writable } from "svelte/store"

export enum Level {
    INFO,
    OK,
    WARN,
    ERROR,
    DEBUG,
}


export type Payload = {
    message: string;
    level: Level;
    meta?: any;
};

export class Logger {
    transports: Transporter[] = [];

    constructor(options: { t: Transporter[] }) {
        if (options.t) {
            this.transports = options.t;
        }
    }

    addTransport({ t }: { t: Transporter }) {
        if (this.transports === undefined) {
            this.transports = [];
        }
        this.transports.push(t);
    }

    log(message: string, l = Level.INFO) {
        this.transports.forEach((t) => {
            if (t.reacToLevels.includes(l)) t.send({ message, level: l });
        });
    }

    catch(err: Error) {
        this.transports.forEach((t) => {
            if (t.reacToLevels.includes(Level.ERROR)) t.catch(err);
        });
    }
}

export abstract class Transporter {
    protected level = {
        [Level.INFO]: {
            title: 'INFO',
            emoji: 'ℹ️ ',
        },
        [Level.OK]: {
            title: 'OK',
            emoji: '✅',
        },
        [Level.WARN]: {
            title: 'WARN',
            emoji: '🚨',
        },
        [Level.ERROR]: {
            title: 'ERROR',
            emoji: '❌',
        },
        [Level.DEBUG]: {
            title: 'DEBUG',
            emoji: '🐛',
        },
    };

    reacToLevels: Level[];

    constructor({ l }: { l: Level[] } = { l: [] }) {
        if (l === undefined || l.length === 0) {
            l = [Level.INFO, Level.OK, Level.WARN, Level.ERROR, Level.DEBUG];
        }
        this.reacToLevels = l;
    }

    abstract send(log: Payload): void;
    catch(err: Error) {
        this.send({ message: err.message, level: Level.ERROR });
    }
}

export class Console extends Transporter {
    async send(log: Payload) {
        const { message, level: l } = log;
        if (l === Level.DEBUG && process.env.NODE_ENV !== 'development') return;
        const { title, emoji } = this.level[l] || this.level[Level.ERROR];
        const out = `${emoji}[${title}] ${message}`;
        console.log(out);
    }

    async catch(err: Error) {
        this.send({ message: err.message, level: Level.ERROR });
    }
}

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
const dev = process.env.NODE_ENV === "development";

const svelte = new SvelteError({ l: [...levels, ...(dev ? [Level.DEBUG] : [])] });
const consoleT = new Console();

const logger = new Logger({ t: [svelte, ...(dev ? [consoleT] : [])] })
export default logger;

