import { build } from 'esbuild';

let result = await build({
	entryPoints: ['src/index.ts'],
	bundle: true,
	outdir: 'dist',
	outfile: 'index.js',
});

console.log(result);
