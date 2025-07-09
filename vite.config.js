import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import eslint from 'vite-plugin-eslint';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	plugins: [
		glsl(),
		eslint(),
		visualizer({
			open: true,
			filename: 'stats.html',
		}),
	],
	build: {
		sourcemap: true,
	},
});
