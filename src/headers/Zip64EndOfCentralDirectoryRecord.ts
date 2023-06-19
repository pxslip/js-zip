import { EOCDR_OFFSETS } from '.';
import { bigIntToNumber } from '../util';
import { BigIntOutOfRangeError, INVALID_HEADER } from '../util/errors';
import { CDH_OFFSETS } from './CentralDirectoryHeader';
import findOffset from './find-offset';

export enum Z64_EOCDR_OFFSETS {
	SIGNATURE = 0x06064b50,
	MIN_HEADER_SIZE = 56,
	LEADING_BYTES = 12,
	SIZE = 4,
	VERSION_MADE_BY = 12,
	VERSION_NEEDED = 14,
	DISK_NUMBER = 16,
	DISK_WITH_CD_START = 20,
	ENTRIES_ON_DISK = 24,
	TOTAL_ENTRIES = 32,
	CD_SIZE = 40,
	CD_OFFSET = 48,
	EXTRA_DATA = 56,
}

export class Zip64EndOfCentralDirectoryRecord {
	private _data: Buffer = Buffer.alloc(Z64_EOCDR_OFFSETS.MIN_HEADER_SIZE);
	private _size = BigInt(0);
	private _versionMade = 0;
	private _versionNeeded = 0;
	private _diskNumber = 0;
	private _diskWithCDStart = 0;
	private _diskEntries = BigInt(0);
	private _totalEntries = BigInt(0);
	private _centralDirectorySize = BigInt(0);
	private _centralDirectoryOffset = BigInt(0);
	constructor(fileData: Buffer, offset: bigint) {
		if (fileData.length > 0) {
			this._data = fileData.subarray(bigIntToNumber(offset));
			if (this._data.readUInt32LE(0) === Z64_EOCDR_OFFSETS.SIGNATURE) {
				this._size = this._data.readBigUInt64LE(Z64_EOCDR_OFFSETS.SIZE);
				this._versionMade = this._data.readUint16LE(Z64_EOCDR_OFFSETS.VERSION_MADE_BY);
				this._versionNeeded = this._data.readUint16LE(Z64_EOCDR_OFFSETS.VERSION_NEEDED);
				this._diskNumber = this._data.readUint32LE(Z64_EOCDR_OFFSETS.DISK_NUMBER);
				this._diskWithCDStart = this._data.readUint32LE(Z64_EOCDR_OFFSETS.DISK_WITH_CD_START);
				this._diskEntries = this._data.readBigUInt64LE(Z64_EOCDR_OFFSETS.ENTRIES_ON_DISK);
				this._totalEntries = this._data.readBigUint64LE(Z64_EOCDR_OFFSETS.TOTAL_ENTRIES);
				this._centralDirectorySize = this._data.readBigUInt64LE(Z64_EOCDR_OFFSETS.CD_SIZE);
				this._centralDirectoryOffset = this._data.readBigUInt64LE(Z64_EOCDR_OFFSETS.CD_OFFSET);
				// trim data back to the actual size of the header
				this._data = this._data.subarray(0, bigIntToNumber(this._size));
			} else {
				throw new Error(INVALID_HEADER);
			}
		}
	}

	public get size() {
		return this._size;
	}
	public set size(value) {
		this._size = value;
	}

	public get versionMade() {
		return this._versionMade;
	}
	public set versionMade(value) {
		this._versionMade = value;
	}

	public get versionNeeded() {
		return this._versionNeeded;
	}
	public set versionNeeded(value) {
		this._versionNeeded = value;
	}

	public get diskNumber() {
		return this._diskNumber;
	}
	public set diskNumber(value) {
		this._diskNumber = value;
	}

	public get diskWithCDStart() {
		return this._diskWithCDStart;
	}
	public set diskWithCDStart(value) {
		this._diskWithCDStart = value;
	}

	public get diskEntries() {
		return this._diskEntries;
	}
	public set diskEntries(value) {
		this._diskEntries = value;
	}

	public get totalEntries() {
		return this._totalEntries;
	}
	public set totalEntries(value) {
		this._totalEntries = value;
	}

	public get centralDirectorySize() {
		return this._centralDirectorySize;
	}
	public set centralDirectorySize(value) {
		this._centralDirectorySize = value;
	}

	public get centralDirectoryOffset() {
		return this._centralDirectoryOffset;
	}
	public set centralDirectoryOffset(value) {
		this._centralDirectoryOffset = value;
	}
}
