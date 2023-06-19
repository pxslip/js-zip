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

export enum LOCAL_HEADER_OFFSETS {
	SIGNATURE = 0x04034b50,
	MIN_HEADER_SIZE = 32,
	VERSION_NEEDED = 4,
	FLAGS = 6,
	COMPRESSION_METHOD = 8,
	LAST_MODIFIED_TIME = 10,
	LAST_MODIFIED_DATE = 12,
	CRC_32 = 14,
	COMPRESSED_SIZE = 18,
	UNCOMPRESSED_SIZE = 22,
	FILE_NAME_LENGTH = 26,
	EXTRA_FIELD_LENGTH = 28,
	FILE_NAME = 30,
}

/**
 * A representation of the local file header
 */
export class LocalHeader {
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
		if (data.readUInt32LE(0) !== LOCAL_HEADER_OFFSETS.SIGNATURE) {
			throw new Error(INVALID_LOC);
		}
		this._version = data.readUInt16LE(LOCAL_HEADER_OFFSETS.VERSION_NEEDED);
		this._flags = data.readUInt16LE(LOCAL_HEADER_OFFSETS.FLAGS);
		// compression method
		this._method = data.readUInt16LE(LOCAL_HEADER_OFFSETS.COMPRESSION_METHOD);
		// modification time
		this._modifiedTime = data.readUInt16LE(LOCAL_HEADER_OFFSETS.LAST_MODIFIED_TIME);
		this._modifiedDate = data.readUInt16LE(LOCAL_HEADER_OFFSETS.LAST_MODIFIED_DATE);
		// uncompressed file crc-32 value
		this._crc32 = data.readUInt32LE(LOCAL_HEADER_OFFSETS.CRC_32);
		// compressed size
		this._compressedSize = data.readUInt32LE(LOCAL_HEADER_OFFSETS.COMPRESSED_SIZE);
		// uncompressed size
		this._uncompressedSize = data.readUInt32LE(LOCAL_HEADER_OFFSETS.UNCOMPRESSED_SIZE);
		// filename length
		this._fileNameLength = data.readUInt16LE(LOCAL_HEADER_OFFSETS.FILE_NAME_LENGTH);
		// extra field length
		this._extraLength = data.readUInt16LE(LOCAL_HEADER_OFFSETS.EXTRA_FIELD_LENGTH);
		this._fileNameRaw = data.subarray(LOCAL_HEADER_OFFSETS.FILE_NAME, this._fileNameLength);
		this._extraRaw = data.subarray(LOCAL_HEADER_OFFSETS.FILE_NAME + this._fileNameLength, this._extraLength);
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
