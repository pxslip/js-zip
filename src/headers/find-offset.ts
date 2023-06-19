import { INVALID_HEADER } from '../util/errors';

interface Options {
	/**
	 * The signature of the header we're looking to find the start of
	 */
	signature: number;
	/**
	 * How many bytes to skip before starting to search
	 */
	skip?: number;
	/**
	 * The signature of the next header
	 */
	nextSignature?: number;
}

export default function (data: Buffer, options: Options) {
	if (data.length > 0) {
		const { skip, signature, nextSignature } = Object.assign({}, { skip: 0 }, options);
		let start = data.length - skip; // subtract 22 bytes since that is the minimum size the EOCDR can be
		while (data.readUInt32LE(start) !== signature) {
			if (data.readUInt32LE(start) === nextSignature) {
				throw new Error(INVALID_HEADER);
			}
			// decrement start until we find the signature
			start--;
			if (start <= 0) {
				throw new Error(INVALID_HEADER);
			}
		}
		return start;
	}
	return 0; //
}
