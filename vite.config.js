import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        farmacias: resolve(__dirname, 'pages/farmacias_pages/farmacias.html'),
        primeiros_socorros: resolve(__dirname, 'pages/primeiro_socorros_pages/primeiros_socorros.html'),
        prevencao: resolve(__dirname, 'pages/prevencao_pages/prevencao.html'),
      },
    },
  },
});
