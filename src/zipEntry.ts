import { EntryHeader, LocalHeader } from './headers';
import { Utils, Constants, Errors } from './util';
import { Deflater, Inflater, ZipCrypto } from './methods';
import { CENHDR, DEFLATED, STORED } from './util/constants';
import { BAD_CRC, UNKNOWN_METHOD } from './util/errors';
import { crc32, toBuffer } from './util/utils';
import { BufferCallback, BufferCallbackWithError } from './types';
import { CentralDirectoryHeader } from './headers/CentralDirectoryHeader';

export class ZipEntry {
	private _centralDirectoryHeader: CentralDirectoryHeader;
	private _localHeader: LocalHeader;
	private _entryName = Buffer.alloc(0);
	private _comment = Buffer.alloc(0);
	private _isDirectory = false;
	private _uncompressedData?: Buffer;
	private _extra = Buffer.alloc(0);
	private _compressedData: Buffer;
	private _fileEntryData: Buffer;

	constructor(central: Buffer = Buffer.alloc(0), filesData: Buffer = Buffer.alloc(0)) {
		this._centralDirectoryHeader = new CentralDirectoryHeader(central);
		//TODO: pull the local header and file data out of the filesData buffer
		this._localHeader = new LocalHeader(filesData);
		this._compressedData = filesData.subarray(this._localHeader)
	}

	get compressedData(): Buffer {
		return this._compressedData;
	}

	get uncompressedData(): Buffer | undefined {
		return this._uncompressedData;
	}

	private crc32OK(data: Buffer) {
		// if bit 3 (0x08) of the general-purpose flags field is set, then the CRC-32 and file sizes are not known when the header is written
		if ((this._entryHeader.flags & 0x8) !== 0x8) {
			if (Utils.crc32(data) !== this._entryHeader.dataHeader.crc) {
				return false;
			}
		} else {
			// @TODO: load and check data descriptor header
			// The fields in the local header are filled with zero, and the CRC-32 and size are appended in a 12-byte structure
			// (optionally preceded by a 4-byte signature) immediately after the compressed data:
		}
		return true;
	}

	/**
	 * TODO: convert to an async/promised based
	 * @param async
	 * @param callback
	 * @param pass
	 * @returns
	 */
	private decompress(
		/*Boolean*/ async?: boolean,
		/*Function*/ callback?: (data: Buffer, error?: string) => void,
		/*String, Buffer*/ pass?: string | Buffer,
	) {
		if (typeof callback === 'undefined' && typeof async === 'string') {
			pass = async;
			async = void 0;
		}
		if (this._isDirectory) {
			if (async && callback) {
				callback(Buffer.alloc(0), Errors.DIRECTORY_CONTENT_ERROR); //si added error.
			}
			return Buffer.alloc(0);
		}

		let compressedData = this.compressedData;

		if (compressedData.length === 0) {
			// File is empty, nothing to decompress.
			if (async && callback) callback(compressedData);
			return compressedData;
		}

		if (this._entryHeader.encripted) {
			if ('string' !== typeof pass && !Buffer.isBuffer(pass)) {
				throw new Error('ADM-ZIP: Incompatible password parameter');
			}
			compressedData = ZipCrypto.decrypt(compressedData, this._entryHeader, pass);
		}

		let data = Buffer.alloc(this._entryHeader.size);

		switch (this._entryHeader.method) {
			case STORED:
				compressedData.copy(data);
				if (!this.crc32OK(data)) {
					if (async && callback) {
						callback(data, BAD_CRC); //si added error
					}
					throw new Error(BAD_CRC);
				} else {
					//si added otherwise did not seem to return data.
					if (async && callback) {
						callback(data);
					}
					return data;
				}
			case DEFLATED:
				let inflater = new Inflater(compressedData);
				if (!async) {
					const result = inflater.inflate();
					result.copy(data, 0);
					if (!this.crc32OK(data)) {
						throw new Error(BAD_CRC + ' ' + this._entryName.toString());
					}
					return data;
				} else {
					inflater.inflateAsync((result) => {
						result.copy(result, 0);
						if (callback) {
							if (!this.crc32OK(result)) {
								callback(result, BAD_CRC); //si added error
							} else {
								callback(result);
							}
						}
					});
				}
				break;
			default:
				if (async && callback) callback(Buffer.alloc(0), UNKNOWN_METHOD);
				throw new Error(UNKNOWN_METHOD);
		}
	}

	private compress(async: boolean, callback?: BufferCallback) {
		if ((!this.uncompressedData || !this.uncompressedData.length) && Buffer.isBuffer(this._input)) {
			// no data set or the data wasn't changed to require recompression
			if (async && callback) {
				callback(this.compressedData);
			}
			return this.compressedData;
		}

		if (this.uncompressedData && this.uncompressedData.length && !this._isDirectory) {
			let compressedData;
			// Local file header
			switch (this._entryHeader.method) {
				case STORED:
					this._entryHeader.compressedSize = this._entryHeader.size;
					compressedData = Buffer.alloc(this.uncompressedData.length);
					this.uncompressedData.copy(compressedData);

					if (async && callback) {
						callback(compressedData);
					}
					return compressedData;
				case DEFLATED:
				default:
					const deflater = new Deflater(this.uncompressedData);
					if (!async) {
						const deflated = deflater.deflate();
						this._entryHeader.compressedSize = deflated.length;
						return deflated;
					} else {
						deflater.deflateAsync((data) => {
							compressedData = Buffer.alloc(data.length);
							this._entryHeader.compressedSize = data.length;
							data.copy(compressedData);
							callback && callback(compressedData);
						});
					}
					break;
			}
		} else if (async && callback) {
			callback(Buffer.alloc(0));
		} else {
			return Buffer.alloc(0);
		}
	}

	private readUInt64LE(buffer: Buffer, offset: number) {
		return (buffer.readUInt32LE(offset + 4) << 4) + buffer.readUInt32LE(offset);
	}

	private parseExtra(data: Buffer) {
		var offset = 0;
		var signature, size, part;
		while (offset < data.length) {
			signature = data.readUInt16LE(offset);
			offset += 2;
			size = data.readUInt16LE(offset);
			offset += 2;
			part = data.slice(offset, offset + size);
			offset += size;
			if (Constants.ID_ZIP64 === signature) {
				this.parseZip64ExtendedInformation(part);
			}
		}
	}

	private parseZip64ExtendedInformation(data: Buffer) {
		var size, compressedSize, offset, diskNumStart;

		if (data.length >= Constants.EF_ZIP64_SCOMP) {
			size = this.readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
			if (this._entryHeader.size === Constants.EF_ZIP64_OR_32) {
				this._entryHeader.size = size;
			}
		}
		if (data.length >= Constants.EF_ZIP64_RHO) {
			compressedSize = this.readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
			if (this._entryHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
				this._entryHeader.compressedSize = compressedSize;
			}
		}
		if (data.length >= Constants.EF_ZIP64_DSN) {
			offset = this.readUInt64LE(data, Constants.EF_ZIP64_RHO);
			if (this._entryHeader.offset === Constants.EF_ZIP64_OR_32) {
				this._entryHeader.offset = offset;
			}
		}
		if (data.length >= Constants.EF_ZIP64_DSN + 4) {
			diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
			if (this._entryHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
				this._entryHeader.diskNumStart = diskNumStart;
			}
		}
	}

	get entryName() {
		return this._entryName.toString();
	}
	get rawEntryName() {
		return this._entryName;
	}
	set entryName(val) {
		this._entryName = toBuffer(val);
		let lastChar = this._entryName[this._entryName.length - 1];
		this._isDirectory = lastChar === 47 || lastChar === 92;
		this._entryHeader.fileNameLength = this._entryName.length;
	}

	get extra() {
		return this._extra;
	}
	set extra(val) {
		this._extra = val;
		this._entryHeader.extraLength = val.length;
		this.parseExtra(val);
	}

	get comment() {
		return this._comment.toString();
	}
	set comment(val) {
		this._comment = toBuffer(val);
		this._entryHeader.commentLength = this._comment.length;
	}

	get name() {
		let n = this._entryName.toString();
		return this._isDirectory
			? n
					.substr(n.length - 1)
					.split('/')
					.pop()
			: n.split('/').pop();
	}
	get isDirectory() {
		return this._isDirectory;
	}

	getCompressedData() {
		return this.compress(false);
	}

	getCompressedDataAsync(callback: BufferCallback) {
		this.compress(true, callback);
	}

	setData(value: Buffer) {
		this._uncompressedData = toBuffer(value);
		if (!this._isDirectory && this._uncompressedData.length) {
			this._entryHeader.size = this._uncompressedData.length;
			this._entryHeader.method = DEFLATED;
			this._entryHeader.crc = crc32(value);
			this._entryHeader.changed = true;
		} else {
			// folders and blank files should be stored
			this._entryHeader.method = STORED;
		}
	}

	getData(pass: Buffer) {
		if (this._entryHeader.changed) {
			return this.uncompressedData;
		} else {
			return this.decompress(false, undefined, pass);
		}
	}

	getDataAsync(callback: BufferCallbackWithError, pass: Buffer) {
		if (this._entryHeader.changed && this.uncompressedData) {
			callback(this.uncompressedData);
		} else {
			this.decompress(true, callback, pass);
		}
	}

	set attr(attr) {
		this._entryHeader.attr = attr;
	}
	get attr() {
		return this._entryHeader.attr;
	}

	set header(data: Buffer) {
		this._entryHeader = new EntryHeader(data);
	}

	get header(): EntryHeader {
		return this._entryHeader;
	}

	packHeader() {
		// 1. create header (buffer)
		var header = this._entryHeader.entryHeaderToBinary();
		var addpos = CENHDR;
		// 2. add file name
		this._entryName.copy(header, addpos);
		addpos += this._entryName.length;
		// 3. add extra data
		if (this._entryHeader.extraLength) {
			this._extra.copy(header, addpos);
			addpos += this._entryHeader.extraLength;
		}
		// 4. add file comment
		if (this._entryHeader.commentLength) {
			this._comment.copy(header, addpos);
		}
		return header;
	}

	toJSON() {
		const bytes = function (nr: Buffer) {
			return '<' + ((nr && nr.length + ' bytes buffer') || 'null') + '>';
		};

		return {
			entryName: this.entryName,
			name: this.name,
			comment: this.comment,
			isDirectory: this.isDirectory,
			header: this._entryHeader.toJSON(),
			compressedData: bytes(this._input),
			data: bytes(this.uncompressedData ?? Buffer.alloc(0)),
		};
	}

	toString() {
		return JSON.stringify(this.toJSON(), null, '\t');
	}
}
