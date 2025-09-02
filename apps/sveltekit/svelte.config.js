import adapter from '@nucel.cloud/pulumi-sveltekit-aws/adapter';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integratons
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			out: '.svelte-kit-aws',
			precompress: false,
			polyfill: true,
		})
	}
};

export default config;
