import { EOCDR_OFFSETS } from '.';
import { INVALID_HEADER } from '../util/errors';
import { CDH_OFFSETS } from './CentralDirectoryHeader';
import findOffset from './find-offset';

export enum Z64_EOCDL_OFFSETS {
	SIGNATURE = 0x07064b50,
	HEADER_SIZE = 20,
	DISK_WITH_Z64_EOCD_START = 4,
	Z64_EOCD_OFFSET = 8,
	NUMBER_DISKS = 16,
}

export class Zip64EndOfCentralDirectoryLocator {
	private _data: Buffer = Buffer.alloc(EOCDR_OFFSETS.MIN_HEADER_SIZE);
	private _diskWithZ64EOCDStart = 0;
	private _z64EOCDOffset = BigInt(0);
	private _numberDisks = 0;
	constructor(fileData: Buffer) {
		if (fileData.length > 0) {
			const offset = findOffset(fileData, {
				signature: Z64_EOCDL_OFFSETS.SIGNATURE,
				skip: Z64_EOCDL_OFFSETS.HEADER_SIZE + EOCDR_OFFSETS.MIN_HEADER_SIZE,
				nextSignature: CDH_OFFSETS.SIGNATURE,
			});
			this._data = fileData.subarray(offset);
			if (this._data.readUInt32LE(0) === Z64_EOCDL_OFFSETS.SIGNATURE) {
				this._diskWithZ64EOCDStart = this._data.readUInt32LE(Z64_EOCDL_OFFSETS.DISK_WITH_Z64_EOCD_START);
				this._z64EOCDOffset = this._data.readBigUInt64LE(Z64_EOCDL_OFFSETS.Z64_EOCD_OFFSET);
				this._numberDisks = this._data.readUint32LE(Z64_EOCDL_OFFSETS.NUMBER_DISKS);
			} else {
				throw new Error(INVALID_HEADER);
			}
		}
	}

	public get diskWithZ64EOCDStart() {
		return this._diskWithZ64EOCDStart;
	}
	public set diskWithZ64EOCDStart(value) {
		this._diskWithZ64EOCDStart = value;
	}

	public get z64EOCDOffset() {
		return this._z64EOCDOffset;
	}
	public set z64EOCDOffset(value) {
		this._z64EOCDOffset = value;
	}

	public get numberDisks() {
		return this._numberDisks;
	}
	public set numberDisks(value) {
		this._numberDisks = value;
	}

	get size() {
		return Z64_EOCDL_OFFSETS.HEADER_SIZE;
	}
}
