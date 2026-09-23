/**
 * Config dinâmica: estende o app.json com valores que vêm do ambiente.
 *
 * A chave do Google Maps precisa estar no app.json final para o build Android,
 * e o app.json não lê variáveis de ambiente — daí este arquivo. Assim a chave
 * fica no .env (fora do git), e não no repositório, que é público.
 *
 * No Expo Go a chave não é necessária: o mapa usa a do próprio Expo Go. Ela só
 * faz falta em build (`eas build`), onde sem ela o mapa aparece cinza.
 */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY },
    },
  },
});
