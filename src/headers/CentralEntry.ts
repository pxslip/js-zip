import { Constants, Errors } from '../util';
import { methodToString } from '../util/constants';
import { isWin } from '../util';

interface Header {
	version: number;
	flags: number;
	method: number;
	time: number;
	crc: number;
	compressedSize: number;
	size: number;
	fnameLen: number;
	extraLen: number;
}

/**
 * A representation of a central directory file header entry
 */
export class CentralEntry {
	private _verMade = 20; // v2.0
	private _version = 10; // v1.0
	private _flags = 0;
	private _method = 0;
	private _time = 0;
	private _crc = 0;
	private _compressedSize = 0;
	private _size = 0;
	private _fnameLen = 0;
	private _extraLen = 0;
	private _comLen = 0;
	private _diskStart = 0;
	private _inattr = 0;
	private _attr = 0;
	private _offset = 0;
	private _changed = false;

	constructor(data: Buffer) {
		if (data.length !== Constants.CENHDR || data.readUInt32LE(0) !== Constants.CENSIG) {
			throw new Error(Errors.INVALID_CEN);
		}
		this._verMade |= isWin ? 0x0a00 : 0x0300;
		this._flags |= Constants.FLG_EFS;
		this._time = this.dateToTime(new Date());
		// data should be 46 bytes and start with "PK 01 02"
		// version made by
		this._verMade = data.readUInt16LE(Constants.CENVEM);
		// version needed to extract
		this._version = data.readUInt16LE(Constants.CENVER);
		// encrypt, decrypt flags
		this._flags = data.readUInt16LE(Constants.CENFLG);
		// compression method
		this._method = data.readUInt16LE(Constants.CENHOW);
		// modification time (2 bytes time, 2 bytes date)
		this._time = data.readUInt32LE(Constants.CENTIM);
		// uncompressed file crc-32 value
		this._crc = data.readUInt32LE(Constants.CENCRC);
		// compressed size
		this._compressedSize = data.readUInt32LE(Constants.CENSIZ);
		// uncompressed size
		this._size = data.readUInt32LE(Constants.CENLEN);
		// filename length
		this._fnameLen = data.readUInt16LE(Constants.CENNAM);
		// extra field length
		this._extraLen = data.readUInt16LE(Constants.CENEXT);
		// file comment length
		this._comLen = data.readUInt16LE(Constants.CENCOM);
		// volume number start
		this._diskStart = data.readUInt16LE(Constants.CENDSK);
		// internal file attributes
		this._inattr = data.readUInt16LE(Constants.CENATT);
		// external file attributes
		this._attr = data.readUInt32LE(Constants.CENATX);
		// LOC header offset
		this._offset = data.readUInt32LE(Constants.CENOFF);
	}

	private dateToTime(val: string | number | Date) {
		val = new Date(val);
		return (
			(((val.getFullYear() - 1980) & 0x7f) << 25) | // b09-16 years from 1980
			((val.getMonth() + 1) << 21) | // b05-08 month
			(val.getDate() << 16) | // b00-04 hour
			// 2 bytes time
			(val.getHours() << 11) | // b11-15 hour
			(val.getMinutes() << 5) | // b05-10 minute
			(val.getSeconds() >> 1)
		); // b00-04 seconds divided by 2
	}

	get made() {
		return this._verMade;
	}
	set made(val) {
		this._verMade = val;
	}

	get version() {
		return this._version;
	}
	set version(val) {
		this._version = val;
	}

	get flags() {
		return this._flags;
	}
	set flags(val) {
		this._flags = val;
	}

	get method() {
		return this._method;
	}
	set method(val) {
		switch (val) {
			case Constants.STORED:
				this.version = 10;
			case Constants.DEFLATED:
			default:
				this.version = 20;
		}
		this._method = val;
	}

	get time() {
		return new Date(
			((this._time >> 25) & 0x7f) + 1980,
			((this._time >> 21) & 0x0f) - 1,
			(this._time >> 16) & 0x1f,
			(this._time >> 11) & 0x1f,
			(this._time >> 5) & 0x3f,
			(this._time & 0x1f) << 1,
		);
	}

	set time(val: string | number | Date) {
		this._time = this.dateToTime(val);
	}

	get crc() {
		return this._crc;
	}
	set crc(val) {
		this._crc = Math.max(0, val) >>> 0;
	}

	get compressedSize() {
		return this._compressedSize;
	}
	set compressedSize(val) {
		this._compressedSize = Math.max(0, val) >>> 0;
	}

	get size() {
		return this._size;
	}
	set size(val) {
		this._size = Math.max(0, val) >>> 0;
	}

	get fileNameLength() {
		return this._fnameLen;
	}
	set fileNameLength(val) {
		this._fnameLen = val;
	}

	get extraLength() {
		return this._extraLen;
	}
	set extraLength(val) {
		this._extraLen = val;
	}

	get commentLength() {
		return this._comLen;
	}
	set commentLength(val) {
		this._comLen = val;
	}

	get diskNumStart() {
		return this._diskStart;
	}
	set diskNumStart(val) {
		this._diskStart = Math.max(0, val) >>> 0;
	}

	get inAttr() {
		return this._inattr;
	}
	set inAttr(val) {
		this._inattr = Math.max(0, val) >>> 0;
	}

	get attr() {
		return this._attr;
	}
	set attr(val) {
		this._attr = Math.max(0, val) >>> 0;
	}

	// get Unix file permissions
	get fileAttr() {
		return this._attr ? (((this._attr >>> 0) | 0) >> 16) & 0xfff : 0;
	}

	get offset() {
		return this._offset;
	}
	set offset(val) {
		this._offset = Math.max(0, val) >>> 0;
	}

	/**
	 * Deprecated for the misspelling
	 * @see {@link CentralEntry#encrypted}
	 * @deprecated
	 */
	get encripted() {
		return this.encrypted;
	}

	get encrypted() {
		return (this._flags & 1) === 1;
	}

	get entryHeaderSize() {
		return Constants.CENHDR + this._fnameLen + this._extraLen + this._comLen;
	}

	get realDataOffset() {
		return this._offset + Constants.LOCHDR + this._fnameLen + this._extraLen;
	}

	get changed() {
		return this._changed;
	}

	set changed(value: boolean) {
		this._changed = value;
	}

	dataHeaderToBinary() {
		// LOC header size (30 bytes)
		const data = Buffer.alloc(Constants.LOCHDR);
		// "PK\003\004"
		data.writeUInt32LE(Constants.LOCSIG, 0);
		// version needed to extract
		data.writeUInt16LE(this._version, Constants.LOCVER);
		// general purpose bit flag
		data.writeUInt16LE(this._flags, Constants.LOCFLG);
		// compression method
		data.writeUInt16LE(this._method, Constants.LOCHOW);
		// modification time (2 bytes time, 2 bytes date)
		data.writeUInt32LE(this._time, Constants.LOCTIM);
		// uncompressed file crc-32 value
		data.writeUInt32LE(this._crc, Constants.LOCCRC);
		// compressed size
		data.writeUInt32LE(this._compressedSize, Constants.LOCSIZ);
		// uncompressed size
		data.writeUInt32LE(this._size, Constants.LOCLEN);
		// filename length
		data.writeUInt16LE(this._fnameLen, Constants.LOCNAM);
		// extra field length
		data.writeUInt16LE(this._extraLen, Constants.LOCEXT);
		return data;
	}

	entryHeaderToBinary() {
		// CEN header size (46 bytes)
		const data = Buffer.alloc(Constants.CENHDR + this._fnameLen + this._extraLen + this._comLen);
		// "PK\001\002"
		data.writeUInt32LE(Constants.CENSIG, 0);
		// version made by
		data.writeUInt16LE(this._verMade, Constants.CENVEM);
		// version needed to extract
		data.writeUInt16LE(this._version, Constants.CENVER);
		// encrypt, decrypt flags
		data.writeUInt16LE(this._flags, Constants.CENFLG);
		// compression method
		data.writeUInt16LE(this._method, Constants.CENHOW);
		// modification time (2 bytes time, 2 bytes date)
		data.writeUInt32LE(this._time, Constants.CENTIM);
		// uncompressed file crc-32 value
		data.writeUInt32LE(this._crc, Constants.CENCRC);
		// compressed size
		data.writeUInt32LE(this._compressedSize, Constants.CENSIZ);
		// uncompressed size
		data.writeUInt32LE(this._size, Constants.CENLEN);
		// filename length
		data.writeUInt16LE(this._fnameLen, Constants.CENNAM);
		// extra field length
		data.writeUInt16LE(this._extraLen, Constants.CENEXT);
		// file comment length
		data.writeUInt16LE(this._comLen, Constants.CENCOM);
		// volume number start
		data.writeUInt16LE(this._diskStart, Constants.CENDSK);
		// internal file attributes
		data.writeUInt16LE(this._inattr, Constants.CENATT);
		// external file attributes
		data.writeUInt32LE(this._attr, Constants.CENATX);
		// LOC header offset
		data.writeUInt32LE(this._offset, Constants.CENOFF);
		// fill all with
		data.fill(0x00, Constants.CENHDR);
		return data;
	}

	toJSON() {
		const bytes = function (nr: number) {
			return nr + ' bytes';
		};

		return {
			made: this._verMade,
			version: this._version,
			flags: this._flags,
			method: methodToString(this._method),
			time: this.time,
			crc: '0x' + this._crc.toString(16).toUpperCase(),
			compressedSize: bytes(this._compressedSize),
			size: bytes(this._size),
			fileNameLength: bytes(this._fnameLen),
			extraLength: bytes(this._extraLen),
			commentLength: bytes(this._comLen),
			diskNumStart: this._diskStart,
			inAttr: this._inattr,
			attr: this._attr,
			offset: this._offset,
			entryHeaderSize: bytes(Constants.CENHDR + this._fnameLen + this._extraLen + this._comLen),
		};
	}

	toString() {
		return JSON.stringify(this.toJSON(), null, '\t');
	}
}
