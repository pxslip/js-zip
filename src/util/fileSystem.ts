export default async function (): Promise<typeof import('node:fs')> {
	if (typeof process === 'object' && process.versions && process.versions['electron']) {
		try {
			// @ts-ignore
			const originalFs = await import('original-fs'); //TODO: This is for electron interoperability, is this necessary?
			if (Object.keys(originalFs).length > 0) {
				return originalFs;
			}
		} catch (e) {}
	}
	return await import('node:fs');
}
