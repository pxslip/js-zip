import fs, { Mode } from 'node:fs';
import path, { dirname, join, normalize } from 'node:path';
import { FileInTheWayError } from './errors';
import type { Options } from '../types';

export const isWin = typeof process === 'object' && 'win32' === process.platform;

const is_Obj = (obj: any) => obj && typeof obj === 'object';

// generate CRC32 lookup table
const crcTable = new Uint32Array(256).map((t, c) => {
	for (let k = 0; k < 8; k++) {
		if ((c & 1) !== 0) {
			c = 0xedb88320 ^ (c >>> 1);
		} else {
			c >>>= 1;
		}
	}
	return c >>> 0;
});

export function crc32update(crc: number, byte: number) {
	return crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
}

export function crc32(buf: Buffer | string) {
	if (typeof buf === 'string') {
		buf = Buffer.from(buf, 'utf8');
	}

	let len = buf.length;
	let crc = ~0;
	for (let off = 0; off < len; ) {
		crc = crc32update(crc, buf[off++]);
	}
	// xor and cast as uint32 number
	return ~crc >>> 0;
}

export class Utils {
	private _sep;
	private _fs;
	constructor(opts: Options) {
		this._sep = path.sep;
		this._fs = opts.fs;
	}

	get fs() {
		if (!this._fs) {
			this._fs = fs;
		}
		return this._fs;
	}

	makeDir(folder: string) {
		// Sync - make directories tree
		let resolvedPath = folder.split(this._sep)[0];
		folder.split(this._sep).forEach((name) => {
			if (!name || name.endsWith(':')) {
				return;
			}
			resolvedPath += this._sep + name;
			try {
				const stat = this.fs.statSync(resolvedPath);
				if (stat.isFile()) {
					throw new FileInTheWayError(resolvedPath);
				}
			} catch (e) {
				// re-throw if it's our error
				if (e instanceof FileInTheWayError) {
					throw e;
				}
				// neither path, nor file exists, create it
				this.fs.mkdirSync(resolvedPath);
			}
		});
	}

	writeFileTo(path: string, content: Buffer, overwrite: boolean, attr: number): boolean {
		if (this.fs.existsSync(path)) {
			if (!overwrite) return false; // cannot overwrite

			const stat = this.fs.statSync(path);
			if (stat.isDirectory()) {
				return false;
			}
		}
		const folder = dirname(path);
		if (!this.fs.existsSync(folder)) {
			this.makeDir(folder);
		}

		let fd;
		try {
			fd = this.fs.openSync(path, 'w', 438); // 0666
		} catch (e) {
			this.fs.chmodSync(path, 438);
			fd = this.fs.openSync(path, 'w', 438);
		}
		if (fd) {
			try {
				this.fs.writeSync(fd, content, 0, content.length, 0);
			} finally {
				this.fs.closeSync(fd);
			}
		}
		this.fs.chmodSync(path, attr || 438);
		return true;
	}

	writeFileToAsync(path: string, content: string, overwrite: string, attr: Mode | Function = 438, callback?: Function) {
		if (typeof attr === 'function' && !callback) {
			callback = attr;
			attr = 438;
		}

		if (callback && typeof callback === 'function' && typeof attr === 'number') {
			const exists = this.fs.existsSync(path);
			if (exists && !overwrite) {
				return callback(false);
			}

			this.fs.stat(path, (err, stat) => {
				if (exists && stat.isDirectory()) {
					return callback(false);
				}

				const folder = dirname(path);
				const folderExists = this.fs.existsSync(folder);
				if (!folderExists) {
					this.makeDir(folder);
				}

				this.fs.open(path, 'w', 438, (err, fd) => {
					if (err) {
						this.fs.chmod(path, 438, () => {
							this.fs.open(path, 'w', 438, (err, fd) => {
								this.fs.write(fd, Buffer.from(content), 0, content.length, 0, () => {
									this.fs.close(fd, () => {
										this.fs.chmod(path, attr, function () {
											callback(true);
										});
									});
								});
							});
						});
					} else if (fd) {
						this.fs.write(fd, Buffer.from(content), 0, content.length, 0, () => {
							this.fs.close(fd, () => {
								this.fs.chmod(path, attr || 438, function () {
									callback(true);
								});
							});
						});
					} else {
						this.fs.chmod(path, attr || 438, function () {
							callback(true);
						});
					}
				});
			});
		}
	}

	findFiles(/*String*/ dir: string) {
		let files: string[] = [];
		this.fs.readdirSync(dir).forEach((file) => {
			let path = join(dir, file);

			if (this.fs.statSync(path).isDirectory() && recursive) {
				files = files.concat(findSync(path, pattern, recursive));
			}

			if (pattern && pattern.test(path)) {
				files.push(normalize(path) + (this.fs.statSync(path).isDirectory() ? this._sep : ''));
			}
		});
		return files;
	}

	/**
	 * Update the CRC32 table
	 * @deprecated
	 * @param crc
	 * @param byte
	 * @returns
	 */
	static crc32update(crc: number, byte: number) {
		return crc32update(crc, byte);
	}

	/**
	 * @deprecated
	 * @param buf
	 * @returns
	 */
	static crc32(buf: Buffer | string) {
		return crc32(buf);
	}
}

// INSTANCED functions

Utils.prototype.makeDir = function (/*String*/ folder) {
	const self = this;

	// Sync - make directories tree
	function mkdirSync(/*String*/ fpath) {
		let resolvedPath = fpath.split(self.sep)[0];
		fpath.split(self.sep).forEach(function (name) {
			if (!name || name.substr(-1, 1) === ':') return;
			resolvedPath += self.sep + name;
			var stat;
			try {
				stat = self.fs.statSync(resolvedPath);
			} catch (e) {
				self.fs.mkdirSync(resolvedPath);
			}
			if (stat && stat.isFile()) throw new FileInTheWayError(resolvedPath);
		});
	}

	mkdirSync(folder);
};

Utils.prototype.writeFileTo = function (/*String*/ path, /*Buffer*/ content, /*Boolean*/ overwrite, /*Number*/ attr) {
	const self = this;
	if (self.fs.existsSync(path)) {
		if (!overwrite) return false; // cannot overwrite

		var stat = self.fs.statSync(path);
		if (stat.isDirectory()) {
			return false;
		}
	}
	var folder = path.dirname(path);
	if (!self.fs.existsSync(folder)) {
		self.makeDir(folder);
	}

	var fd;
	try {
		fd = self.fs.openSync(path, 'w', 438); // 0666
	} catch (e) {
		self.fs.chmodSync(path, 438);
		fd = self.fs.openSync(path, 'w', 438);
	}
	if (fd) {
		try {
			self.fs.writeSync(fd, content, 0, content.length, 0);
		} finally {
			self.fs.closeSync(fd);
		}
	}
	self.fs.chmodSync(path, attr || 438);
	return true;
};

Utils.prototype.writeFileToAsync = function (
	/*String*/ path,
	/*Buffer*/ content,
	/*Boolean*/ overwrite,
	/*Number*/ attr,
	/*Function*/ callback,
) {
	if (typeof attr === 'function') {
		callback = attr;
		attr = undefined;
	}

	const self = this;

	self.fs.exists(path, function (exist) {
		if (exist && !overwrite) return callback(false);

		self.fs.stat(path, function (err, stat) {
			if (exist && stat.isDirectory()) {
				return callback(false);
			}

			var folder = path.dirname(path);
			self.fs.exists(folder, function (exists) {
				if (!exists) self.makeDir(folder);

				self.fs.open(path, 'w', 438, function (err, fd) {
					if (err) {
						self.fs.chmod(path, 438, function () {
							self.fs.open(path, 'w', 438, function (err, fd) {
								self.fs.write(fd, content, 0, content.length, 0, function () {
									self.fs.close(fd, function () {
										self.fs.chmod(path, attr || 438, function () {
											callback(true);
										});
									});
								});
							});
						});
					} else if (fd) {
						self.fs.write(fd, content, 0, content.length, 0, function () {
							self.fs.close(fd, function () {
								self.fs.chmod(path, attr || 438, function () {
									callback(true);
								});
							});
						});
					} else {
						self.fs.chmod(path, attr || 438, function () {
							callback(true);
						});
					}
				});
			});
		});
	});
};

Utils.prototype.findFiles = function (/*String*/ path) {
	const self = this;

	function findSync(/*String*/ dir, /*RegExp*/ pattern, /*Boolean*/ recursive) {
		if (typeof pattern === 'boolean') {
			recursive = pattern;
			pattern = undefined;
		}
		let files = [];
		self.fs.readdirSync(dir).forEach(function (file) {
			var path = path.join(dir, file);

			if (self.fs.statSync(path).isDirectory() && recursive) files = files.concat(findSync(path, pattern, recursive));

			if (!pattern || pattern.test(path)) {
				files.push(path.normalize(path) + (self.fs.statSync(path).isDirectory() ? self.sep : ''));
			}
		});
		return files;
	}

	return findSync(path, undefined, true);
};

Utils.prototype.getAttributes = function () {};

Utils.prototype.setAttributes = function () {};

// STATIC functions

// crc32 single update (it is part of crc32)
Utils.crc32update = function (crc, byte) {
	return crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
};

Utils.crc32 = function (buf) {
	if (typeof buf === 'string') {
		buf = Buffer.from(buf, 'utf8');
	}
	// Generate crcTable
	if (!crcTable.length) genCRCTable();

	let len = buf.length;
	let crc = ~0;
	for (let off = 0; off < len; ) crc = Utils.crc32update(crc, buf[off++]);
	// xor and cast as uint32 number
	return ~crc >>> 0;
};

// converts buffer, Uint8Array, string types to buffer
export function toBuffer(/*buffer, Uint8Array, string*/ input: Buffer | Uint8Array | string) {
	if (Buffer.isBuffer(input)) {
		return input;
	} else if (input instanceof Uint8Array) {
		return Buffer.from(input);
	} else {
		// expect string all other values are invalid and return empty buffer
		return typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.alloc(0);
	}
}

export function readBigUInt64LE(/*Buffer*/ buffer: Buffer, /*int*/ index: number) {
	var slice = Buffer.from(buffer.subarray(index, index + 8));
	slice.swap64();

	return parseInt(`0x${slice.toString('hex')}`);
}

Utils.isWin = isWin; // Do we have windows system
Utils.crcTable = crcTable;
