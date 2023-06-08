import { ZlibOptions, createDeflateRaw, deflateRawSync } from 'zlib';

export class Deflater {
	private _buffer: Buffer;
	private _options: ZlibOptions;
	constructor(buffer: Buffer) {
		this._buffer = buffer;
		this._options = { chunkSize: (buffer.length / 1024 + 1) * 1024 };
	}
	deflate() {
		return deflateRawSync(this._buffer, this._options);
	}

	deflateAsync(callback?: (buffer: Buffer) => void) {
		const tmp = createDeflateRaw(this._options);
		const parts: Buffer[] = [];
		let total = 0;
		tmp.on('data', (data) => {
			parts.push(data);
			total += data.length;
		});
		tmp.on('end', () => {
			const buf = Buffer.alloc(total);
			let written = 0;
			buf.fill(0);
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				part.copy(buf, written);
				written += part.length;
			}
			if (callback) {
				callback(buf);
			}
		});
		tmp.end(this._buffer);
	}
}
