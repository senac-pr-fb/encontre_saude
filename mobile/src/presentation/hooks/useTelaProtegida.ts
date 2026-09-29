import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

/**
 * Bloqueia print e gravação de tela enquanto a tela estiver montada
 * (FLAG_SECURE no Android; no iOS a gravação sai em branco). Usar nas telas
 * que mostram dados de saúde, CPF ou senha. A `chave` separa as telas entre si:
 * sair de uma não libera a captura de outra que ainda esteja montada.
 */
export function useTelaProtegida(chave: string) {
  ScreenCapture.usePreventScreenCapture(chave);
}

/**
 * iOS: desfoca a miniatura do app no alternador de apps, que de outro modo
 * mostraria a última tela aberta (ficha de saúde, pré-prontuário) a quem pegar
 * o aparelho. No Android o FLAG_SECURE de useTelaProtegida já cobre isso.
 */
export function useProtecaoAlternadorApps() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    ScreenCapture.enableAppSwitcherProtectionAsync().catch(() => undefined);
    return () => {
      ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => undefined);
    };
  }, []);
}
