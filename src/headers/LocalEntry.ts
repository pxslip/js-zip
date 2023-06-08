import {
	LOCCRC,
	LOCDAT,
	LOCEND,
	LOCEXT,
	LOCFLG,
	LOCHOW,
	LOCLEN,
	LOCNAM,
	LOCSIG,
	LOCSIZ,
	LOCTIM,
	LOCVER,
} from '../util/constants';
import { INVALID_LOC } from '../util/errors';

/**
 * A representation of the local file header
 */
export class LocalEntry {
	private _version: number;
	private _flags: number;
	private _method: number;
	private _modifiedTime: number;
	private _modifiedDate: number;
	private _crc32: number;
	private _compressedSize: number;
	private _uncompressedSize: number;
	private _fileNameLength: number;
	private _extraLength: number;
	private _fileNameRaw: Buffer;
	private _extraRaw: Buffer;

	constructor(data: Buffer) {
		// 30 bytes and should start with "PK\003\004"
		if (data.readUInt32LE(0) !== LOCSIG) {
			throw new Error(INVALID_LOC);
		}
		this._version = data.readUInt16LE(LOCVER);
		this._flags = data.readUInt16LE(LOCFLG);
		// compression method
		this._method = data.readUInt16LE(LOCHOW);
		// modification time
		this._modifiedTime = data.readUInt16LE(LOCTIM);
		this._modifiedDate = data.readUInt16LE(LOCDAT);
		// uncompressed file crc-32 value
		this._crc32 = data.readUInt32LE(LOCCRC);
		// compressed size
		this._compressedSize = data.readUInt32LE(LOCSIZ);
		// uncompressed size
		this._uncompressedSize = data.readUInt32LE(LOCLEN);
		// filename length
		this._fileNameLength = data.readUInt16LE(LOCNAM);
		// extra field length
		this._extraLength = data.readUInt16LE(LOCEXT);
		this._fileNameRaw = data.subarray(LOCEND, this._fileNameLength);
		this._extraRaw = data.subarray(LOCEND + this._fileNameLength, this._extraLength);
	}

	public get version(): number {
		return this._version;
	}
	public set version(value: number) {
		this._version = value;
	}

	public get flags(): number {
		return this._flags;
	}
	public set flags(value: number) {
		this._flags = value;
	}

	public get method(): number {
		return this._method;
	}
	public set method(value: number) {
		this._method = value;
	}

	public get modifiedTime(): number {
		return this._modifiedTime;
	}
	public set modifiedTime(value: number) {
		this._modifiedTime = value;
	}

	public get modifiedDate(): number {
		return this._modifiedDate;
	}
	public set modifiedDate(value: number) {
		this._modifiedDate = value;
	}

	public get crc32(): number {
		return this._crc32;
	}
	public set crc32(value: number) {
		this._crc32 = value;
	}

	public get compressedSize(): number {
		return this._compressedSize;
	}
	public set compressedSize(value: number) {
		this._compressedSize = value;
	}

	public get uncompressedSize(): number {
		return this._uncompressedSize;
	}
	public set uncompressedSize(value: number) {
		this._uncompressedSize = value;
	}

	public get fileNameLength(): number {
		return this._fileNameLength;
	}
	public set fileNameLength(value: number) {
		this._fileNameLength = value;
	}

	public get extraLength(): number {
		return this._extraLength;
	}
	public set extraLength(value: number) {
		this._extraLength = value;
	}

	public get fileNameRaw(): Buffer {
		return this._fileNameRaw;
	}
	public set fileNameRaw(value: Buffer) {
		this._fileNameRaw = value;
	}

	public get extraRaw(): Buffer {
		return this._extraRaw;
	}
	public set extraRaw(value: Buffer) {
		this._extraRaw = value;
	}
}
