import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
    base: '/billions/', // Must match the GitHub repository name
    plugins: [glsl()]
});
