import { createInflateRaw, inflateRawSync } from 'zlib';

export class Inflater {
	private _buffer: Buffer;
	constructor(buffer: Buffer) {
		this._buffer = buffer;
	}

	inflate() {
		return inflateRawSync(this._buffer);
	}

	inflateAsync(/*Function*/ callback?: (buffer: Buffer) => void) {
		const tmp = createInflateRaw();
		const parts: Buffer[] = [];
		let total = 0;
		tmp.on('data', (data) => {
			parts.push(data);
			total += data.length;
		});
		tmp.on('end', function () {
			var buf = Buffer.alloc(total),
				written = 0;
			buf.fill(0);
			for (var i = 0; i < parts.length; i++) {
				const part = parts[i];
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
