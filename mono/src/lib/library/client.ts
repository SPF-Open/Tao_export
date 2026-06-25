import DbWorker from './worker/db.worker?worker';
import type {
	LibraryCommand,
	LibraryCommandMap,
	LibraryRequest,
	LibraryResponse
} from './types.js';

/**
 * Main-thread RPC wrapper around the database worker. Each call posts a request
 * with a unique id and resolves when the matching response arrives. The worker
 * is created lazily on first use so the route can be imported during SSR.
 */
class LibraryClient {
	#worker: Worker | null = null;
	#nextId = 1;
	#pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

	#ensureWorker(): Worker {
		if (this.#worker) return this.#worker;
		const worker = new DbWorker();
		worker.onmessage = (event: MessageEvent<LibraryResponse>) => {
			const msg = event.data;
			const entry = this.#pending.get(msg.id);
			if (!entry) return;
			this.#pending.delete(msg.id);
			if (msg.ok) entry.resolve(msg.data);
			else entry.reject(new Error(msg.error));
		};
		worker.onerror = (event) => {
			const error = new Error(event.message || 'Library worker error');
			for (const { reject } of this.#pending.values()) reject(error);
			this.#pending.clear();
		};
		this.#worker = worker;
		return worker;
	}

	call<C extends LibraryCommand>(
		command: C,
		data: LibraryCommandMap[C]['req'],
		transfer: Transferable[] = []
	): Promise<LibraryCommandMap[C]['res']> {
		const worker = this.#ensureWorker();
		const id = this.#nextId++;
		const request: LibraryRequest<C> = { id, command, data };
		return new Promise<LibraryCommandMap[C]['res']>((resolve, reject) => {
			this.#pending.set(id, {
				resolve: resolve as (v: unknown) => void,
				reject
			});
			worker.postMessage(request, transfer);
		});
	}
}

/** Singleton client shared by the library store. */
export const libraryClient = new LibraryClient();
