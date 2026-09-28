// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

const bloquear = (nome, patterns) => ({
  'no-restricted-imports': ['error', { patterns: patterns.map((p) => ({ ...p, message: `${nome}: ${p.message}` })) }],
});

const libsDeInfra = ['react', 'react-native', 'react-native-*', 'expo', 'expo-*', '@expo/*', '@supabase/*', '@tanstack/*', 'firebase', 'firebase/*', '@react-native-async-storage/*'];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  // Camadas: presentation/app -> domain <- data; core/di compõe tudo.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: bloquear('domain', [
      { group: ['@data/*', '@presentation/*', '@core/di/*', '@core/config/*'], message: 'domain não depende de outras camadas (só de @core/utils).' },
      { group: libsDeInfra, message: 'domain não importa frameworks nem SDKs.' },
    ]),
  },
  {
    files: ['src/data/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: bloquear('data', [
      { group: ['@presentation/*', '@core/di/*'], message: 'data não conhece a UI nem o container.' },
    ]),
  },
  {
    files: ['src/presentation/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: bloquear('presentation', [
      { group: ['@data/*'], message: 'acesse dados por @core/di/container, nunca direto de @data.' },
      { group: ['@supabase/*', 'firebase', 'firebase/*'], message: 'SDKs de backend ficam em @data.' },
    ]),
  },
  {
    files: ['src/core/utils/**/*.{ts,tsx}', 'src/core/config/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: bloquear('core', [
      { group: ['@data/*', '@domain/*', '@presentation/*'], message: 'core/utils e core/config não dependem de outras camadas.' },
    ]),
  },
]);
