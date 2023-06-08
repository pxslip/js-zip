import { Utils, Constants, Errors } from './util';
import { join, normalize, resolve, sep as pathSeparator, posix, basename, relative } from 'node:path';
// @ts-ignore
import ZipEntry from './zipEntry';
// @ts-ignore
import ZipFile from './zipFile';
import type { BufferCallbackWithError, EntryKey, Options } from './types';
import { FileNotFoundError } from './util/errors';
import { Stats } from 'node:fs';

type EntryKeyOrString = EntryKey | string;

const get_Bool = (val: any, def: boolean): boolean => (typeof val === 'boolean' ? val : def);
const get_Str = (val: any, def: string): string => (typeof val === 'string' ? val : def);

const defaultOptions: Options = {
	// option "noSort" : if true it disables files sorting
	noSort: false,
	// read entries during load (initial loading may be slower)
	readEntries: false,
	// default method is none
	method: Constants.NONE,
};

export class Zip {
	private filetools: Utils;
	private zipFile: ZipFile;

	constructor(options: Options = {}) {
		let inBuffer;
		const { input, ...opts } = Object.assign({}, defaultOptions, options);

		// instanciate utils filesystem
		this.filetools = new Utils(opts);
		if (Buffer.isBuffer(input)) {
			inBuffer = input;
			opts.method = Constants.BUFFER;
		}
		// if input is file name we retrieve its content
		else if (input && 'string' === typeof input) {
			// load zip file
			if (this.filetools.fs.existsSync(input)) {
				opts.method = Constants.FILE;
				opts.filename = input;
				inBuffer = this.filetools.fs.readFileSync(input);
			} else {
				throw new Error(Errors.INVALID_FILENAME);
			}
		}
		this.zipFile = new ZipFile(inBuffer, opts);
	}

	// removes ".." style path elements
	/**
	 * Removes .. path segments
	 *
	 * TODO: Determine if this can be replaced with calls to path.resolve
	 * @param path the path to normalize
	 * @returns
	 */
	canonical(path: string) {
		if (!path) {
			return '';
		}
		// trick normalize think path is absolute
		const safeSuffix = posix.normalize('/' + path.split('\\').join('/'));
		return join('.', safeSuffix);
	}

	// make abolute paths taking prefix as root folder
	sanitize(prefix: string, name: string) {
		prefix = resolve(normalize(prefix));
		const parts = name.split('/');
		for (let i = 0, l = parts.length; i < l; i++) {
			const path = normalize(join(prefix, parts.slice(i, l).join(pathSeparator)));
			if (path.indexOf(prefix) === 0) {
				return path;
			}
		}
		return normalize(join(prefix, basename(name)));
	}

	/**
	 * Get an entry from the current zipfile
	 * @param entry The entry to get
	 * @returns The entry if found, null if not
	 */
	getEntry(entry: EntryKeyOrString) {
		if (entry && this.zipFile) {
			let item;
			// If entry was given as a file name
			if (typeof entry === 'string') {
				item = this.zipFile.getEntry(entry);
			}
			// if entry was given as a ZipEntry object
			if (typeof entry === 'object' && typeof entry.entryName !== 'undefined' && typeof entry.header !== 'undefined') {
				item = this.zipFile.getEntry(entry.entryName);
			}
			if (item) {
				return item;
			}
		}
		return null;
	}

	fixPath(zipPath: string) {
		const { join, normalize, sep } = posix;
		// convert windows file separators and normalize
		return join('.', normalize(sep + zipPath.split('\\').join(sep) + sep));
	}

	/**
	 * Extracts the given entry from the archive and returns the content as a Buffer object
	 * @param entry ZipEntry object or String with the full path of the entry
	 *
	 * @return Buffer or Null in case of error
	 */
	readFile(entry: EntryKeyOrString, pass: string | Buffer) {
		var item = this.getEntry(entry);
		return (item && item.getData(pass)) || null;
	}

	/**
	 * Asynchronous readFile
	 * @param entry ZipEntry object or String with the full path of the entry
	 * @param callback
	 *
	 * @return Buffer or Null in case of error
	 */
	readFileAsync(/**Object*/ entry: EntryKeyOrString, /**Function*/ callback: Function) {
		var item = this.getEntry(entry);
		if (item) {
			item.getDataAsync(callback);
		} else {
			callback(null, 'getEntry failed for:' + entry);
		}
	}

	/**
	 * Extracts the given entry from the archive and returns the content as plain text in the given encoding
	 * @param entry ZipEntry object or String with the full path of the entry
	 * @param encoding Optional. If no encoding is specified utf8 is used
	 *
	 * @return String
	 */
	readAsText(entry: EntryKeyOrString, encoding: string) {
		var item = this.getEntry(entry);
		if (item) {
			var data = item.getData();
			if (data && data.length) {
				return data.toString(encoding || 'utf8');
			}
		}
		return ''; // TODO: silently failing feels awkward, throw an error
	}

	/**
	 * Asynchronous readAsText
	 * @param entry ZipEntry object or String with the full path of the entry
	 * @param callback
	 * @param encoding Optional. If no encoding is specified utf8 is used
	 *
	 * @return String
	 */
	readAsTextAsync(
		entry: EntryKeyOrString,
		callback: BufferCallbackWithError,
		encoding: BufferEncoding,
	) {
		const item = this.getEntry(entry);
		if (item) {
			item.getDataAsync((data: Buffer, err: string) => { //TODO: what are the data types here?
				if (err) {
					callback(data, err);
					return;
				}

				if (data && data.length) {
					callback(data.toString(encoding || 'utf8'));
				} else {
					callback('');
				}
			});
		} else {
			callback('');
		}
	}

	/**
	 * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
	 *
	 * @param entry
	 */
	deleteFile(/**Object*/ entry: EntryKeyOrString) {
		// @TODO: test deleteFile
		var item = this.getEntry(entry);
		if (item) {
			this.zipFile.deleteEntry(item.entryName);
		}
	}

	/**
	 * Adds a comment to the zip. The zip must be rewritten after adding the comment.
	 *
	 * @param comment
	 */
	addZipComment(/**String*/ comment: string) {
		// @TODO: test addZipComment
		this.zipFile.comment = comment;
	}

	/**
	 * Returns the zip comment
	 *
	 * @return String
	 */
	getZipComment() {
		return this.zipFile.comment || '';
	}

	/**
	 * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
	 * The comment cannot exceed 65535 characters in length
	 *
	 * @param entry
	 * @param comment
	 */
	addZipEntryComment(/**Object*/ entry: EntryKeyOrString, /**String*/ comment: string) {
		var item = this.getEntry(entry);
		if (item) {
			item.comment = comment;
		}
	}

	/**
	 * Returns the comment of the specified entry
	 *
	 * @param entry
	 * @return String
	 */
	getZipEntryComment(/**Object*/ entry: EntryKeyOrString) {
		const item = this.getEntry(entry);
		if (item) {
			return item.comment || '';
		}
		return '';
	}

	/**
	 * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
	 *
	 * @param entry
	 * @param content
	 */
	updateFile(/**Object*/ entry: EntryKeyOrString, /**Buffer*/ content: Buffer) {
		const item = this.getEntry(entry);
		if (item) {
			item.setData(content);
		}
	}

	/**
	 * Adds a file from the disk to the archive
	 *
	 * @param localPath File to add to zip
	 * @param zipPath Optional path inside the zip
	 * @param zipName Optional name for the file
	 * @param comment A comment to attach to the entry
	 *
	 * @throws FileNotFoundError if the local file does not exist
	 */
	addLocalFile(
		/**String*/ localPath: string,
		/**String=*/ zipPath: string,
		/**String=*/ zipName: string,
		/**String*/ comment: string,
	) {
		if (this.filetools.fs.existsSync(localPath)) {
			// fix ZipPath
			zipPath = zipPath ? this.fixPath(zipPath) : '';

			// p - local file name
			var p = localPath.split('\\').join('/').split('/').pop();

			// add file name into zippath
			zipPath += zipName ? zipName : p;

			// read file attributes
			const _attr = this.filetools.fs.statSync(localPath);

			// add file into zip file
			this.addFile(zipPath, this.filetools.fs.readFileSync(localPath), comment, _attr);
		} else {
			throw new FileNotFoundError(localPath);
		}
	}

	/**
	 * Adds a local directory and all its nested files and directories to the archive
	 *
	 * @param localPath
	 * @param zipPath optional path inside zip
	 * @param filter optional RegExp or Function if files match will
	 *               be included.
	 * @param {number | object} attr - number as unix file permissions, object as filesystem Stats object
	 */
	addLocalFolder(
		/**String*/ localPath: string,
		/**String=*/ zipPath: string,
		/**=RegExp|Function*/ filter: RegExp | Function,
		/**=number|object*/ attr: number,
	) {
		// Prepare filter
		let filterFn: (path: string) => boolean;
		if (filter instanceof RegExp) {
			// if filter is RegExp wrap it
			filterFn = ((rx) => {
				return (filename: string) => {
					return rx.test(filename);
				};
			})(filter);
		} else if ('function' !== typeof filter) {
			// if filter is not function we will replace it
			filterFn = function () {
				return true;
			};
		}

		// fix ZipPath
		zipPath = zipPath ? this.fixPath(zipPath) : '';

		// normalize the path first
		localPath = normalize(localPath);

		if (this.filetools.fs.existsSync(localPath)) {
			const items = this.filetools.findFiles(localPath);

			if (items.length) {
				items.forEach((filepath) => {
					var p = relative(localPath, filepath).split('\\').join('/'); //windows fix
					if (filterFn(p)) {
						var stats = this.filetools.fs.statSync(filepath);
						if (stats.isFile()) {
							this.addFile(zipPath + p, this.filetools.fs.readFileSync(filepath), '', attr ? attr : stats);
						} else {
							this.addFile(zipPath + p + '/', Buffer.alloc(0), '', attr ? attr : stats);
						}
					}
				});
			}
		} else {
			throw new FileNotFoundError(localPath);
		}
	}

	/**
	 * Asynchronous addLocalFile
	 * @param localPath
	 * @param callback
	 * @param zipPath optional path inside zip
	 * @param filter optional RegExp or Function if files match will
	 *               be included.
	 */
	addLocalFolderAsync(/*String*/ localPath: string, /*Function*/ callback: (data?: boolean, err?: string | Error), /*String*/ zipPath: string, /*RegExp|Function*/ filter: ((path: string) => boolean) | RegExp) {
		let filterFn: (path: string) => boolean;
		if (filter instanceof RegExp) {
			filterFn = (function (rx) {
				return function (filename) {
					return rx.test(filename);
				};
			})(filter);
		} else if ('function' !== typeof filter) {
			filterFn = function () {
				return true;
			};
		}

		// fix ZipPath
		zipPath = zipPath ? this.fixPath(zipPath) : '';

		// normalize the path first
		localPath = normalize(localPath);

		this.filetools.fs.open(localPath, 'r', (err) => {
			if (err && err.code === 'ENOENT') {
				callback(undefined, new FileNotFoundError(localPath));
			} else if (err) {
				callback(undefined, err);
			} else {
				const items = this.filetools.findFiles(localPath);
				let i = -1;

				const next = () => {
					i += 1;
					if (i < items.length) {
						const filepath = items[i];
						const p = relative(localPath, filepath).split('\\').join('/') //windows fix
							.normalize('NFD')
							.replace(/[\u0300-\u036f]/g, '')
							.replace(/[^\x20-\x7E]/g, ''); // accent fix
						if (filterFn(p)) {
							this.filetools.fs.stat(filepath, (er0, stats) => {
								if (er0) callback(undefined, er0);
								if (stats.isFile()) {
									this.filetools.fs.readFile(filepath, (er1, data) => {
										if (er1) {
											callback(undefined, er1);
										} else {
											this.addFile(zipPath + p, data, '', stats);
											next();
										}
									});
								} else {
									this.addFile(zipPath + p + '/', Buffer.alloc(0), '', stats);
									next();
								}
							});
						} else {
							process.nextTick(() => {
								next();
							});
						}
					} else {
						callback(true, undefined);
					}
				};

				next();
			}
		});
	}

	/**
	 *
	 * @param {string} localPath - path where files will be extracted
	 * @param {object} props - optional properties
	 * @param {string} props.zipPath - optional path inside zip
	 * @param {regexp, function} props.filter - RegExp or Function if files match will be included.
	 */
	addLocalFolderPromise(/*String*/ localPath, /* object */ props) {
		return new Promise((resolve, reject) => {
			const { filter, zipPath } = Object.assign({}, props);
			this.addLocalFolderAsync(
				localPath,
				(done, err) => {
					if (err) reject(err);
					if (done) resolve(this);
				},
				zipPath,
				filter,
			);
		});
	}

	/**
	 * Allows you to create a entry (file or directory) in the zip file.
	 * If you want to create a directory the entryName must end in / and a null buffer should be provided.
	 * Comment and attributes are optional
	 *
	 * @param {string} entryName
	 * @param {Buffer | string} content - file content as buffer or utf8 coded string
	 * @param {string} comment - file comment
	 * @param {number | object} attr - number as unix file permissions, object as filesystem Stats object
	 */
	addFile(entryName: string, /**Buffer*/ content: Buffer, /**String*/ comment: string, /**Number*/ attr: number | Stats) {
		let entry = this.getEntry(entryName);
		const update = entry != null;

		// prepare new entry
		if (!update) {
			entry = new ZipEntry();
			entry.entryName = entryName;
		}
		entry.comment = comment || '';

		const isStat = 'object' === typeof attr && attr instanceof Stats;

		// last modification time from file stats
		if (isStat) {
			entry.header.time = attr.mtime;
		}

		// Set file attribute
		var fileattr = entry.isDirectory ? 0x10 : 0; // (MS-DOS directory flag)

		// extended attributes field for Unix
		// set file type either S_IFDIR / S_IFREG
		let unix = entry.isDirectory ? 0x4000 : 0x8000;

		if (isStat) {
			// File attributes from file stats
			unix |= 0xfff & attr.mode;
		} else if ('number' === typeof attr) {
			// attr from given attr values
			unix |= 0xfff & attr;
		} else {
			// Default values:
			unix |= entry.isDirectory ? 0o755 : 0o644; // permissions (drwxr-xr-x) or (-r-wr--r--)
		}

		fileattr = (fileattr | (unix << 16)) >>> 0; // add attributes

		entry.attr = fileattr;

		entry.setData(content);
		if (!update) this.zipFile.setEntry(entry);
	}

	/**
	 * Returns an array of ZipEntry objects representing the files and folders inside the archive
	 *
	 * @return Array
	 */
	getEntries() {
		return this.zipFile ? this.zipFile.entries : [];
	}

	getEntryCount() {
		return this.zipFile.getEntryCount();
	}

	forEach(callback) {
		return this.zipFile.forEach(callback);
	}

	/**
	 * Extracts the given entry to the given targetPath
	 * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
	 *
	 * @param entry ZipEntry object or String with the full path of the entry
	 * @param targetPath Target folder where to write the file
	 * @param maintainEntryPath If maintainEntryPath is true and the entry is inside a folder, the entry folder
	 *                          will be created in targetPath as well. Default is TRUE
	 * @param overwrite If the file already exists at the target path, the file will be overwriten if this is true.
	 *                  Default is FALSE
	 * @param keepOriginalPermission The file will be set as the permission from the entry if this is true.
	 *                  Default is FALSE
	 * @param outFileName String If set will override the filename of the extracted file (Only works if the entry is a file)
	 *
	 * @return Boolean
	 */
	extractEntryTo(
		/**Object*/ entry,
		/**String*/ targetPath,
		/**Boolean*/ maintainEntryPath,
		/**Boolean*/ overwrite,
		/**Boolean*/ keepOriginalPermission,
		/**String**/ outFileName,
	) {
		overwrite = get_Bool(overwrite, false);
		keepOriginalPermission = get_Bool(keepOriginalPermission, false);
		maintainEntryPath = get_Bool(maintainEntryPath, true);
		outFileName = get_Str(outFileName, get_Str(keepOriginalPermission, undefined));

		var item = getEntry(entry);
		if (!item) {
			throw new Error(Utils.Errors.NO_ENTRY);
		}

		var entryName = canonical(item.entryName);

		var target = sanitize(
			targetPath,
			outFileName && !item.isDirectory ? outFileName : maintainEntryPath ? entryName : path.basename(entryName),
		);

		if (item.isDirectory) {
			var children = this.zipFile.getEntryChildren(item);
			children.forEach(function (child) {
				if (child.isDirectory) return;
				var content = child.getData();
				if (!content) {
					throw new Error(Utils.Errors.CANT_EXTRACT_FILE);
				}
				var name = canonical(child.entryName);
				var childName = sanitize(targetPath, maintainEntryPath ? name : path.basename(name));
				// The reverse operation for attr depend on method addFile()
				const fileAttr = keepOriginalPermission ? child.header.fileAttr : undefined;
				filetools.writeFileTo(childName, content, overwrite, fileAttr);
			});
			return true;
		}

		var content = item.getData();
		if (!content) throw new Error(Utils.Errors.CANT_EXTRACT_FILE);

		if (filetools.fs.existsSync(target) && !overwrite) {
			throw new Error(Utils.Errors.CANT_OVERRIDE);
		}
		// The reverse operation for attr depend on method addFile()
		const fileAttr = keepOriginalPermission ? entry.header.fileAttr : undefined;
		filetools.writeFileTo(target, content, overwrite, fileAttr);

		return true;
	}

	/**
	 * Test the archive
	 *
	 */
	test(pass) {
		if (!this.zipFile) {
			return false;
		}

		for (var entry in this.zipFile.entries) {
			try {
				if (entry.isDirectory) {
					continue;
				}
				var content = this.zipFile.entries[entry].getData(pass);
				if (!content) {
					return false;
				}
			} catch (err) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Extracts the entire archive to the given location
	 *
	 * @param targetPath Target location
	 * @param overwrite If the file already exists at the target path, the file will be overwriten if this is true.
	 *                  Default is FALSE
	 * @param keepOriginalPermission The file will be set as the permission from the entry if this is true.
	 *                  Default is FALSE
	 */
	extractAllTo(
		/**String*/ targetPath,
		/**Boolean*/ overwrite,
		/**Boolean*/ keepOriginalPermission,
		/*String, Buffer*/ pass,
	) {
		overwrite = get_Bool(overwrite, false);
		pass = get_Str(keepOriginalPermission, pass);
		keepOriginalPermission = get_Bool(keepOriginalPermission, false);
		if (!this.zipFile) {
			throw new Error(Utils.Errors.NOthis.zipFile);
		}
		this.zipFile.entries.forEach(function (entry) {
			var entryName = sanitize(targetPath, canonical(entry.entryName.toString()));
			if (entry.isDirectory) {
				filetools.makeDir(entryName);
				return;
			}
			var content = entry.getData(pass);
			if (!content) {
				throw new Error(Utils.Errors.CANT_EXTRACT_FILE);
			}
			// The reverse operation for attr depend on method addFile()
			const fileAttr = keepOriginalPermission ? entry.header.fileAttr : undefined;
			filetools.writeFileTo(entryName, content, overwrite, fileAttr);
			try {
				filetools.fs.utimesSync(entryName, entry.header.time, entry.header.time);
			} catch (err) {
				throw new Error(Utils.Errors.CANT_EXTRACT_FILE);
			}
		});
	}

	/**
	 * Asynchronous extractAllTo
	 *
	 * @param targetPath Target location
	 * @param overwrite If the file already exists at the target path, the file will be overwriten if this is true.
	 *                  Default is FALSE
	 * @param keepOriginalPermission The file will be set as the permission from the entry if this is true.
	 *                  Default is FALSE
	 * @param callback The callback will be executed when all entries are extracted successfully or any error is thrown.
	 */
	extractAllToAsync(
		/**String*/ targetPath,
		/**Boolean*/ overwrite,
		/**Boolean*/ keepOriginalPermission,
		/**Function*/ callback,
	) {
		overwrite = get_Bool(overwrite, false);
		if (typeof keepOriginalPermission === 'function' && !callback) callback = keepOriginalPermission;
		keepOriginalPermission = get_Bool(keepOriginalPermission, false);
		if (!callback) {
			callback = function (err) {
				throw new Error(err);
			};
		}
		if (!this.zipFile) {
			callback(new Error(Utils.Errors.NOthis.zipFile));
			return;
		}

		targetPath = path.resolve(targetPath);
		// convert entryName to
		const getPath = (entry) => sanitize(targetPath, path.normalize(canonical(entry.entryName.toString())));
		const getError = (msg, file) => new Error(msg + ': "' + file + '"');

		// separate directories from files
		const dirEntries = [];
		const fileEntries = new Set();
		this.zipFile.entries.forEach((e) => {
			if (e.isDirectory) {
				dirEntries.push(e);
			} else {
				fileEntries.add(e);
			}
		});

		// Create directory entries first synchronously
		// this prevents race condition and assures folders are there before writing files
		for (const entry of dirEntries) {
			const dirPath = getPath(entry);
			// The reverse operation for attr depend on method addFile()
			const dirAttr = keepOriginalPermission ? entry.header.fileAttr : undefined;
			try {
				filetools.makeDir(dirPath);
				if (dirAttr) filetools.fs.chmodSync(dirPath, dirAttr);
				// in unix timestamp will change if files are later added to folder, but still
				filetools.fs.utimesSync(dirPath, entry.header.time, entry.header.time);
			} catch (er) {
				callback(getError('Unable to create folder', dirPath));
			}
		}

		// callback wrapper, for some house keeping
		const done = () => {
			if (fileEntries.size === 0) {
				callback();
			}
		};

		// Extract file entries asynchronously
		for (const entry of fileEntries.values()) {
			const entryName = path.normalize(canonical(entry.entryName.toString()));
			const filePath = sanitize(targetPath, entryName);
			entry.getDataAsync(function (content, err_1) {
				if (err_1) {
					callback(new Error(err_1));
					return;
				}
				if (!content) {
					callback(new Error(Utils.Errors.CANT_EXTRACT_FILE));
				} else {
					// The reverse operation for attr depend on method addFile()
					const fileAttr = keepOriginalPermission ? entry.header.fileAttr : undefined;
					filetools.writeFileToAsync(filePath, content, overwrite, fileAttr, function (succ) {
						if (!succ) {
							callback(getError('Unable to write file', filePath));
							return;
						}
						filetools.fs.utimes(filePath, entry.header.time, entry.header.time, function (err_2) {
							if (err_2) {
								callback(getError('Unable to set times', filePath));
								return;
							}
							fileEntries.delete(entry);
							// call the callback if it was last entry
							done();
						});
					});
				}
			});
		}
		// call the callback if fileEntries was empty
		done();
	}

	/**
	 * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
	 *
	 * @param targetFileName
	 * @param callback
	 */
	writeZip(/**String*/ targetFileName, /**Function*/ callback) {
		if (arguments.length === 1) {
			if (typeof targetFileName === 'function') {
				callback = targetFileName;
				targetFileName = '';
			}
		}

		if (!targetFileName && opts.filename) {
			targetFileName = opts.filename;
		}
		if (!targetFileName) return;

		var zipData = this.zipFile.compressToBuffer();
		if (zipData) {
			var ok = filetools.writeFileTo(targetFileName, zipData, true);
			if (typeof callback === 'function') callback(!ok ? new Error('failed') : null, '');
		}
	}

	writeZipPromise(/**String*/ targetFileName, /* object */ props) {
		const { overwrite, perm } = Object.assign({ overwrite: true }, props);

		return new Promise((resolve, reject) => {
			// find file name
			if (!targetFileName && opts.filename) targetFileName = opts.filename;
			if (!targetFileName) reject('ADM-ZIP: ZIP File Name Missing');

			this.toBufferPromise().then((zipData) => {
				const ret = (done) => (done ? resolve(done) : reject("ADM-ZIP: Wasn't able to write zip file"));
				filetools.writeFileToAsync(targetFileName, zipData, overwrite, perm, ret);
			}, reject);
		});
	}

	toBufferPromise() {
		return new Promise((resolve, reject) => {
			this.zipFile.toAsyncBuffer(resolve, reject);
		});
	}

	/**
	 * Returns the content of the entire zip file as a Buffer object
	 *
	 * @return Buffer
	 */
	toBuffer(/**Function=*/ onSuccess, /**Function=*/ onFail, /**Function=*/ onItemStart, /**Function=*/ onItemEnd) {
		this.valueOf = 2;
		if (typeof onSuccess === 'function') {
			this.zipFile.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
			return null;
		}
		return this.zipFile.compressToBuffer();
	}
}
