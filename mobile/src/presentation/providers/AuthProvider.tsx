import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import type { Usuario } from '@domain/entities/Usuario';
import { container } from '@core/di/container';

interface AuthState {
  usuario: Usuario | null;
  /** true até a sessão persistida ser lida do disco — segura a splash. */
  carregando: boolean;
  /**
   * true quando a sessão veio do link de recuperação e a senha ainda não foi
   * trocada. Nesse estado o app só oferece a tela de nova senha.
   */
  recuperandoSenha: boolean;
  /** Chamado depois que a nova senha foi salva: libera o resto do app. */
  encerrarRecuperacao: () => void;
}

const AuthContext = createContext<AuthState>({
  usuario: null,
  carregando: true,
  recuperandoSenha: false,
  encerrarRecuperacao: () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);
  const url = Linking.useURL();
  const ultimaUrl = useRef<string | null>(null);
  const router = useRouter();
  const { repo, recuperacao, limparDadosLocais } = container.auth;

  // Sessão persistida + eventos (login, logout, refresh)
  useEffect(() => {
    Promise.all([repo.getUsuarioAtual(), recuperacao.ativa()]).then(([u, emRecuperacao]) => {
      setUsuario(u);
      // Reabrir o app no meio da recuperação continua exigindo a nova senha.
      // `atual ||`: se o deep link terminou antes desta leitura, não desfaz a marca.
      setRecuperandoSenha((atual) => atual || (u !== null && emRecuperacao));
      setCarregando(false);
    });
    return repo.onAuthStateChange((u, evento) => {
      setUsuario(u);
      if (evento === 'SIGNED_OUT') {
        setRecuperandoSenha(false);
        // Cobre também a sessão que acaba sem o botão "Sair" (token revogado/expirado).
        limparDadosLocais.execute();
      }
    });
  }, [repo, recuperacao, limparDadosLocais]);

  // Deep link do e-mail de recuperação (o retorno do OAuth é tratado no próprio login)
  useEffect(() => {
    if (!url || url === ultimaUrl.current) return;
    ultimaUrl.current = url;
    repo.restaurarSessaoDeLink(url).then(async (r) => {
      if (r.ok && r.value === 'recuperacao') {
        await recuperacao.marcar();
        setRecuperandoSenha(true);
        router.replace('/nova-senha');
      }
    });
  }, [url, repo, recuperacao, router]);

  // Renova o token só com o app em primeiro plano (recomendação do Supabase)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') repo.iniciarAutoRefresh();
      else repo.pararAutoRefresh();
    });
    return () => sub.remove();
  }, [repo]);

  const encerrarRecuperacao = useCallback(() => setRecuperandoSenha(false), []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, recuperandoSenha, encerrarRecuperacao }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
