export interface Options {
	input?: Buffer | string;
	noSort?: boolean;
	readEntries?: boolean;
	method?: number;
	fs?: typeof import('node:fs');
	filename?: string;
}

export interface EntryKey {
	entryName: string;
	header: string;
}

export type BufferCallback = (buffer: Buffer) => void;
export type BufferCallbackWithError = (buffer: Buffer, error?: string) => void;
