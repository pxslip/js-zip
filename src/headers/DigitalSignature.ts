import { EOCDR_OFFSETS } from '.';
import { INVALID_HEADER } from '../util/errors';
import { CDH_OFFSETS } from './CentralDirectoryHeader';
import findOffset from './find-offset';

export enum DIGITAL_SIGNATURE_OFFSETS {
	SIGNATURE = 0x05054b50,
	MIN_HEADER_SIZE = 6,
	DATA_SIZE = 4,
	SIGNATURE_DATA = 6,
}

export class Zip64EndOfCentralDirectoryLocator {
	private _data: Buffer;
	private _dataSize = 0;
	private _signatureData: Buffer;
	constructor(fileData: Buffer) {
		const offset = findOffset(fileData, {
			signature: DIGITAL_SIGNATURE_OFFSETS.SIGNATURE,
			skip: DIGITAL_SIGNATURE_OFFSETS.MIN_HEADER_SIZE + EOCDR_OFFSETS.MIN_HEADER_SIZE,
			nextSignature: CDH_OFFSETS.SIGNATURE,
		});
		this._data = fileData.subarray(offset);
		if (this._data.readUInt32LE(0) === DIGITAL_SIGNATURE_OFFSETS.SIGNATURE) {
			this._dataSize = this._data.readUint16LE(DIGITAL_SIGNATURE_OFFSETS.DATA_SIZE);
			this._signatureData = this._data.subarray(DIGITAL_SIGNATURE_OFFSETS.SIGNATURE_DATA, this._dataSize);
		} else {
			throw new Error(INVALID_HEADER);
		}
	}

	public get signatureData(): Buffer {
		return this._signatureData;
	}
	public set signatureData(value: Buffer) {
		this._signatureData = value;
	}
}
