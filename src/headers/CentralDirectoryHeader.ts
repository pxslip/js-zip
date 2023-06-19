import { EOCDR_OFFSETS, LOCAL_HEADER_OFFSETS } from '.';
import findOffset from './find-offset';

export enum CDH_OFFSETS {
	SIGNATURE = 0x02014b50,
	MIN_HEADER_SIZE = 46, //TODO: reconfirm this number
	VERSION_MADE_BY = 4,
	VERSION_NEEDED = 6,
	FLAGS = 8,
	METHOD = 10,
	LAST_MODIFIED_TIME = 12,
	LAST_MODIFIED_DATE = 14,
	CRC_32 = 16,
	COMPRESSED_SIZE = 20,
	UNCOMPRESSED_SIZE = 24,
	FILE_NAME_LENGTH = 28,
	EXTRA_FIELD_LENGTH = 30,
	COMMENT_LENGTH = 32,
	DISK_START = 34,
	INTERNAL_ATTRS = 36,
	EXTERNAL_ATTRS = 38,
	LOCAL_HEADER_OFFSET = 42,
	FILE_NAME = 46,
}

export enum EXTRA_FIELD_SIGNATURES {
	ZIP64 = 0x0001,
	AVINFO = 0x0007,
	PFS = 0x0008,
	OS2 = 0x0009,
	NTFS = 0x000a,
	OPENVMS = 0x000c,
	UNIX = 0x000d,
	FORK = 0x000e,
	PATCH = 0x000f,
	X509_PKCS7 = 0x0014,
	X509_CERTID_F = 0x0015,
	X509_CERTID_C = 0x0016,
	STRONGENC = 0x0017,
	RECORD_MGT = 0x0018,
	X509_PKCS7_RL = 0x0019,
	IBM1 = 0x0065,
	IBM2 = 0x0066,
	POSZIP = 0x4690,
}

function parseExtraField(extra: Buffer) {
	let offset = 0;
	const extraFields = new Map<number, Buffer>();
	while (offset < extra.length) {
		const signature = extra.readUint16LE(offset);
		offset += 2;
		const size = extra.readUInt16LE(offset);
		offset += 2;
		const data = extra.subarray(offset, offset + size);
		offset += size;
		extraFields.set(signature, data);
	}
	return extraFields;
}

export class CentralDirectoryHeader {
	private _data: Buffer;
	private _versionMade = 0;
	private _versionNeeded = 0;
	private _flags = 0;
	private _method = 0;
	private _lastModifiedTime = 0;
	private _lastModifiedDate = 0;
	private _crc32 = 0;
	private _compressedSize = 0;
	private _uncompressedSize = 0;
	private _fileNameLength = 0;
	private _extraFieldLength = 0;
	private _commentLength = 0;
	private _diskStart = 0;
	private _internalAttrs = 0;
	private _externalAttrs = 0;
	private _localHeaderOffset = 0;
	private _fileName = Buffer.alloc(0);
	private _extraField = Buffer.alloc(0);
	private _extraFields = new Map<number, Buffer>();
	private _comment = Buffer.alloc(0);

	constructor(data?: Buffer) {
		this._data = data ?? Buffer.alloc(0);
		if (this._data.length > 0 && this._data.readUint32LE(0) === CDH_OFFSETS.SIGNATURE) {
			this._versionMade = this._data.readInt16LE(CDH_OFFSETS.VERSION_MADE_BY);
			this._versionNeeded = this._data.readUInt16LE(CDH_OFFSETS.VERSION_NEEDED);
			this._flags = this._data.readUint16LE(CDH_OFFSETS.FLAGS);
			this._method = this._data.readUint16LE(CDH_OFFSETS.METHOD);
			this._lastModifiedTime = this._data.readUInt16LE(CDH_OFFSETS.LAST_MODIFIED_TIME);
			this._lastModifiedDate = this._data.readUInt16LE(CDH_OFFSETS.LAST_MODIFIED_DATE);
			this._crc32 = this._data.readUint32LE(CDH_OFFSETS.CRC_32);
			this._compressedSize = this._data.readUint32LE(CDH_OFFSETS.COMPRESSED_SIZE);
			this._uncompressedSize = this._data.readUint32LE(CDH_OFFSETS.UNCOMPRESSED_SIZE);
			this._fileNameLength = this._data.readUint16LE(CDH_OFFSETS.FILE_NAME_LENGTH);
			this._extraFieldLength = this._data.readUint16LE(CDH_OFFSETS.EXTRA_FIELD_LENGTH);
			this._commentLength = this._data.readUInt16LE(CDH_OFFSETS.COMMENT_LENGTH);
			this._diskStart = this._data.readUInt16LE(CDH_OFFSETS.DISK_START);
			this._internalAttrs = this._data.readUInt16LE(CDH_OFFSETS.INTERNAL_ATTRS);
			this._externalAttrs = this._data.readUint32LE(CDH_OFFSETS.EXTERNAL_ATTRS);
			this._localHeaderOffset = this._data.readUInt32LE(CDH_OFFSETS.LOCAL_HEADER_OFFSET);
			this._fileName = this._data.subarray(CDH_OFFSETS.FILE_NAME, this._fileNameLength);
			this._extraField = this._data.subarray(CDH_OFFSETS.FILE_NAME + this._fileNameLength, this._extraFieldLength);
			this._extraFields = parseExtraField(this._extraField);
			if (this._extraFields.has(EXTRA_FIELD_SIGNATURES.ZIP64)) {
				// use the data from the zip 64 fields instead
				//TODO:
			}
			this._comment = this._data.subarray(CDH_OFFSETS.FILE_NAME + this._fileNameLength + this._extraFieldLength);
			// trim the data buffer to avoid accidentally writing to a different record
			this._data = this._data.subarray(0, this.size);
		}
	}

	get size() {
		return CDH_OFFSETS.MIN_HEADER_SIZE + this._fileNameLength + this._extraFieldLength + this._commentLength;
	}

	private get osCompatibilityFlag() {
		switch (process.platform) {
			case 'win32':
				return 0x0a00;
			case 'darwin':
				return 0x1300;
			default:
				return 0x0300;
		}
	}
}
