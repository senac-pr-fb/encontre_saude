import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import type { Usuario } from '@domain/entities/Usuario';
import { container } from '@core/di/container';

interface AuthState {
  usuario: Usuario | null;
  /** true até a sessão persistida ser lida do disco — segura a splash. */
  carregando: boolean;
}

const AuthContext = createContext<AuthState>({ usuario: null, carregando: true });

export function AuthProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const url = Linking.useURL();
  const ultimaUrl = useRef<string | null>(null);
  const router = useRouter();
  const { repo } = container.auth;

  // Sessão persistida + eventos (login, logout, refresh)
  useEffect(() => {
    repo.getUsuarioAtual().then((u) => {
      setUsuario(u);
      setCarregando(false);
    });
    return repo.onAuthStateChange((u) => setUsuario(u));
  }, [repo]);

  // Deep links com tokens: link do e-mail de recuperação, retorno do OAuth
  useEffect(() => {
    if (!url || url === ultimaUrl.current) return;
    ultimaUrl.current = url;
    repo.restaurarSessaoDeLink(url).then((r) => {
      if (r.ok && r.value === 'recuperacao') router.replace('/nova-senha');
    });
  }, [url, repo, router]);

  // Renova o token só com o app em primeiro plano (recomendação do Supabase)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') repo.iniciarAutoRefresh();
      else repo.pararAutoRefresh();
    });
    return () => sub.remove();
  }, [repo]);

  return <AuthContext.Provider value={{ usuario, carregando }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
