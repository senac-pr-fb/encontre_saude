import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * true quando o app roda dentro do Expo Go, e nao num build proprio.
 *
 * Importa porque o Expo Go impoe restricoes que o build nao tem: o
 * compartilhamento de arquivos nao consegue ler o diretorio da sandbox dele, e
 * o deep link do OAuth usa exp:// com IP da rede local, que nao e estavel.
 */
export const ehExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
