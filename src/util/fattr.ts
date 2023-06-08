import getFs from './fileSystem';
import { basename } from 'node:path';

const fs = await getFs();

export class FileAttr {
	private _isDirectory: boolean = false;
	private _isReadonly: boolean = false;
	private _isHidden: boolean = false;
	private _isExecutable: boolean = false;
	private _mtime: Date = new Date(0);
	private _atime: Date = new Date(0);
	private _path: string = '';

	constructor(path: string = '') {
		const stat = fs.statSync(path);
		this._path = path;
		this._isDirectory = stat.isDirectory();
		this._mtime = stat.mtime;
		this._atime = stat.atime;
		this._isExecutable = (0o111 & stat.mode) !== 0;
		this._isReadonly = (0o200 & stat.mode) === 0;
		this._isHidden = basename(path)[0] === '.';
	}

	get directory() {
		return this._isDirectory;
	}

	get readOnly() {
		return this._isReadonly;
	}

	get hidden() {
		return this._isHidden;
	}

	get mtime() {
		return this._mtime;
	}

	get atime() {
		return this._atime;
	}

	get executable() {
		return this._isExecutable;
	}

	decodeAttributes() {}

	encodeAttributes() {}

	toJSON() {
		return {
			path: this._path,
			isDirectory: this.directory,
			isReadOnly: this.readOnly,
			isHidden: this.hidden,
			isExecutable: this.executable,
			mTime: this.mtime,
			aTime: this.atime,
		};
	}

	toString() {
		return JSON.stringify(this.toJSON(), null, '\t');
	}
}
