// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Manifold Studio',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tonyhschu/manifold-cad-live-preview' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
	vite: {
		optimizeDeps: {
			exclude: ['manifold-3d'],
		},
	},
});
