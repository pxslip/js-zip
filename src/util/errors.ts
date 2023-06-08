/* Header error messages */
export const INVALID_LOC = 'Invalid LOC header (bad signature)';
export const INVALID_CEN = 'Invalid CEN header (bad signature)';
export const INVALID_END = 'Invalid END header (bad signature)';

/* ZipEntry error messages*/
export const NO_DATA = 'Nothing to decompress';
export const BAD_CRC = 'CRC32 checksum failed';
export const FILE_IN_THE_WAY = 'There is a file in the way: %s';
export const UNKNOWN_METHOD = 'Invalid/unsupported compression method';

/* Inflater error messages */
export const AVAIL_DATA = 'inflate::Available inflate data did not terminate';
export const INVALID_DISTANCE = 'inflate::Invalid literal/length or distance code in fixed or dynamic block';
export const TO_MANY_CODES = 'inflate::Dynamic block code description: too many length or distance codes';
export const INVALID_REPEAT_LEN = 'inflate::Dynamic block code description: repeat more than specified lengths';
export const INVALID_REPEAT_FIRST = 'inflate::Dynamic block code description: repeat lengths with no first length';
export const INCOMPLETE_CODES = 'inflate::Dynamic block code description: code lengths codes incomplete';
export const INVALID_DYN_DISTANCE = 'inflate::Dynamic block code description: invalid distance code lengths';
export const INVALID_CODES_LEN = 'inflate::Dynamic block code description: invalid literal/length code lengths';
export const INVALID_STORE_BLOCK = "inflate::Stored block length did not match one's complement";
export const INVALID_BLOCK_TYPE = 'inflate::Invalid block type (type == 3)';

/* ADM-ZIP error messages */
export const CANT_EXTRACT_FILE = 'Could not extract the file';
export const CANT_OVERRIDE = 'Target file already exists';
export const NO_ZIP = 'No zip file was loaded';
export const NO_ENTRY = "Entry doesn't exist";
export const DIRECTORY_CONTENT_ERROR = 'A directory cannot have content';
export const FILE_NOT_FOUND = 'File not found: %s';
export const NOT_IMPLEMENTED = 'Not implemented';
export const INVALID_FILENAME = 'Invalid filename';
export const INVALID_FORMAT = 'Invalid or unsupported zip format. No END header found';

export class FileInTheWayError extends Error {
	constructor(path: string) {
		super(`There is a file in the way: ${path}`);
	}
}

export class FileNotFoundError extends Error {
	constructor(file: string) {
		super(`File not found: ${file}`);
	}
}
