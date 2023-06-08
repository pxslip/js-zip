import {
	ENDCOM,
	ENDHDR,
	ENDOFF,
	ENDSIG,
	ENDSIZ,
	ENDSUB,
	ENDTOT,
	ZIP64HDR,
	ZIP64OFF,
	ZIP64SIG,
	ZIP64SIZE,
	ZIP64SUB,
	ZIP64TOT,
} from '../util/constants';
import { INVALID_END } from '../util/errors';
import { readBigUInt64LE } from '../util/utils';

/* The entries in the end of central directory */
export class EndOfCentralDirectory {
	private _volumeEntries = 0;
	private _totalEntries = 0;
	private _size = 0;
	private _offset = 0;
	private _commentLength = 0;

	/**
	 * TODO: Add diskNumber, centralDirectoryDiskStart, comment
	 * @param data a buffer containing the End of Central Directory Record data
	 */
	constructor(data: Buffer) {
		// data should be 22 bytes and start with "PK 05 06"
		// or be 56+ bytes and start with "PK 06 06" for Zip64
		if (
			(data.length !== ENDHDR || data.readUInt32LE(0) !== ENDSIG) &&
			(data.length < ZIP64HDR || data.readUInt32LE(0) !== ZIP64SIG)
		) {
			throw new Error(INVALID_END);
		}

		if (data.readUInt32LE(0) === ENDSIG) {
			// number of entries on this volume
			this._volumeEntries = data.readUInt16LE(ENDSUB);
			// total number of entries
			this._totalEntries = data.readUInt16LE(ENDTOT);
			// central directory size in bytes
			this._size = data.readUInt32LE(ENDSIZ);
			// offset of first CEN header
			this._offset = data.readUInt32LE(ENDOFF);
			// zip file comment length
			this._commentLength = data.readUInt16LE(ENDCOM);
		} else {
			// number of entries on this volume
			this._volumeEntries = readBigUInt64LE(data, ZIP64SUB);
			// total number of entries
			this._totalEntries = readBigUInt64LE(data, ZIP64TOT);
			// central directory size in bytes
			this._size = readBigUInt64LE(data, ZIP64SIZE);
			// offset of first CEN header
			this._offset = readBigUInt64LE(data, ZIP64OFF);

			this._commentLength = 0;
		}
	}

	get diskEntries() {
		return this._volumeEntries;
	}
	set diskEntries(val) {
		this._volumeEntries = this._totalEntries = val;
	}

	get totalEntries() {
		return this._totalEntries;
	}
	set totalEntries(val) {
		this._totalEntries = this._volumeEntries = val;
	}

	get size() {
		return this._size;
	}
	set size(val) {
		this._size = val;
	}

	get offset() {
		return this._offset;
	}
	set offset(val) {
		this._offset = val;
	}

	get commentLength() {
		return this._commentLength;
	}
	set commentLength(val) {
		this._commentLength = val;
	}

	get mainHeaderSize() {
		return ENDHDR + this._commentLength;
	}

	toBinary() {
		var b = Buffer.alloc(ENDHDR + this._commentLength);
		// "PK 05 06" signature
		b.writeUInt32LE(ENDSIG, 0);
		b.writeUInt32LE(0, 4);
		// number of entries on this volume
		b.writeUInt16LE(this._volumeEntries, ENDSUB);
		// total number of entries
		b.writeUInt16LE(this._totalEntries, ENDTOT);
		// central directory size in bytes
		b.writeUInt32LE(this._size, ENDSIZ);
		// offset of first CEN header
		b.writeUInt32LE(this._offset, ENDOFF);
		// zip file comment length
		b.writeUInt16LE(this._commentLength, ENDCOM);
		// fill comment memory with spaces so no garbage is left there
		b.fill(' ', ENDHDR);

		return b;
	}

	toJSON() {
		// creates 0x0000 style output
		const offset = function (nr: number, len: number) {
			let offs = nr.toString(16).toUpperCase();
			while (offs.length < len) offs = '0' + offs;
			return '0x' + offs;
		};

		return {
			diskEntries: this._volumeEntries,
			totalEntries: this._totalEntries,
			size: this._size + ' bytes',
			offset: offset(this._offset, 4),
			commentLength: this._commentLength,
		};
	}

	toString() {
		return JSON.stringify(this.toJSON(), null, '\t');
	}
}
