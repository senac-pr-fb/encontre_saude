import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'pages/login_pages/login.html'),
        perfil: resolve(__dirname, 'pages/perfil_pages/perfil.html'),
        farmacias: resolve(__dirname, 'pages/farmacias_pages/farmacias.html'),
        primeiros_socorros: resolve(__dirname, 'pages/primeiro_socorros_pages/primeiros_socorros.html'),
        prevencao: resolve(__dirname, 'pages/prevencao_pages/prevencao.html'),
        recuperar_senha: resolve(__dirname, 'pages/recuperar_senha_pages/recuperar_senha.html'),
        pre_prontuario: resolve(__dirname, 'pages/pre_prontuario_pages/pre_prontuario.html'),
      },
    },
  },
});
