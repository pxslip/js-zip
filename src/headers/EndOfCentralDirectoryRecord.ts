import { INVALID_END } from '../util/errors';
import { CDH_OFFSETS } from './CentralDirectoryHeader';
import findOffset from './find-offset';

export enum EOCDR_OFFSETS {
	MIN_HEADER_SIZE = 22,
	SIGNATURE = 0x06054b50,
	DISK_NUMBER = 4,
	DISK_WITH_CD_START = 6,
	ENTRIES_ON_DISK = 8,
	TOTAL_ENTRIES = 10,
	CD_SIZE = 12,
	CD_OFFSET = 16,
	COMMENT_LENGTH = 20,
	COMMENT_VALUE = 22,
}

/* The entries in the end of central directory */
export class EndOfCentralDirectoryRecord {
	private _diskNumber = 0;
	private _diskWithCDStart = 0;
	private _diskEntries = 0;
	private _totalEntries = 0;
	private _centralDirectorySize = 0;
	private _centralDirectoryOffset = 0;
	private _commentLength = 0;
	private _commentRaw: Buffer;

	/**
	 * @param data a buffer containing the End of Central Directory Record data
	 */
	constructor(data: Buffer) {
		// find the offset of the EOCDR
		const offset = findOffset(data, {
			signature: EOCDR_OFFSETS.SIGNATURE,
			skip: EOCDR_OFFSETS.MIN_HEADER_SIZE,
			nextSignature: CDH_OFFSETS.SIGNATURE,
		});
		const headerData = data.subarray(offset, data.length);
		// reconfirm we have the correct signature
		if (headerData.readUInt32LE(0) === EOCDR_OFFSETS.SIGNATURE) {
			// the disk number
			this._diskNumber = data.readUInt16LE(EOCDR_OFFSETS.DISK_NUMBER);
			// the disk with the central directory
			this._diskWithCDStart = data.readUInt16LE(EOCDR_OFFSETS.DISK_WITH_CD_START);
			// number of entries on this disk
			this._diskEntries = data.readUInt16LE(EOCDR_OFFSETS.ENTRIES_ON_DISK);
			// total number of entries
			this._totalEntries = data.readUInt16LE(EOCDR_OFFSETS.TOTAL_ENTRIES);
			// central directory size in bytes
			this._centralDirectorySize = data.readUInt32LE(EOCDR_OFFSETS.CD_SIZE);
			// offset of first CEN header
			this._centralDirectoryOffset = data.readUInt32LE(EOCDR_OFFSETS.CD_OFFSET);
			// zip file comment length
			this._commentLength = data.readUInt16LE(EOCDR_OFFSETS.COMMENT_LENGTH);
			// store the buffer with the comment in it
			this._commentRaw = data.subarray(EOCDR_OFFSETS.COMMENT_VALUE, this._commentLength);
		} else {
			throw new Error(INVALID_END);
		}
	}

	get diskEntries() {
		return this._diskEntries;
	}
	set diskEntries(val) {
		this._diskEntries = this._totalEntries = val;
	}

	get totalEntries() {
		return this._totalEntries;
	}
	set totalEntries(val) {
		this._totalEntries = this._diskEntries = val;
	}

	get centralDirectorySize() {
		return this._centralDirectorySize;
	}
	set centralDirectorySize(val) {
		this._centralDirectorySize = val;
	}

	get centralDirectoryOffset() {
		return this._centralDirectoryOffset;
	}
	set centralDirectoryOffset(val) {
		this._centralDirectoryOffset = val;
	}

	public get diskWithCDStart() {
		return this._diskWithCDStart;
	}
	public set diskWithCDStart(value) {
		this._diskWithCDStart = value;
	}

	public get diskNumber() {
		return this._diskNumber;
	}
	public set diskNumber(value) {
		this._diskNumber = value;
	}

	get headerSize() {
		return EOCDR_OFFSETS.MIN_HEADER_SIZE + this._commentLength;
	}

	get commentLength() {
		return this._commentLength;
	}

	get comment() {
		return this._commentRaw;
	}
	set comment(val: string | Buffer) {
		val = Buffer.from(val);
		this._commentRaw = val;
		this._commentLength = val.length;
	}

	get size() {
		return EOCDR_OFFSETS.MIN_HEADER_SIZE + this.commentLength;
	}

	toBinary() {
		var b = Buffer.alloc(this.headerSize);
		// "PK 05 06" signature
		b.writeUInt32LE(EOCDR_OFFSETS.SIGNATURE, 0);
		b.writeUInt32LE(0, 4);
		// number of entries on this volume
		b.writeUInt16LE(this._diskEntries, EOCDR_OFFSETS.ENTRIES_ON_DISK);
		// total number of entries
		b.writeUInt16LE(this._totalEntries, EOCDR_OFFSETS.TOTAL_ENTRIES);
		// central directory size in bytes
		b.writeUInt32LE(this._centralDirectorySize, EOCDR_OFFSETS.CD_SIZE);
		// offset of first CEN header
		b.writeUInt32LE(this._centralDirectoryOffset, EOCDR_OFFSETS.CD_OFFSET);
		// zip file comment length
		b.writeUInt16LE(this._commentLength, EOCDR_OFFSETS.COMMENT_LENGTH);
		// fill comment memory with spaces so no garbage is left there
		b.set(this._commentRaw, EOCDR_OFFSETS.COMMENT_VALUE);

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
			diskEntries: this._diskEntries,
			totalEntries: this._totalEntries,
			size: this._centralDirectorySize + ' bytes',
			offset: offset(this._centralDirectoryOffset, 4),
			commentLength: this._commentLength,
		};
	}

	toString() {
		return JSON.stringify(this.toJSON(), null, '\t');
	}
}
