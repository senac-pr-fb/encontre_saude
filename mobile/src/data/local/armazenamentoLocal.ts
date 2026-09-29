import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RascunhoRepository, TriagemLocalRepository } from '@domain/repositories/ProntuarioRepository';
import type { RecuperacaoSenhaRepository } from '@domain/repositories/AuthRepository';
import { VALIDADE_TRIAGEM_MS, type TriagemRecente } from '@domain/entities/PreProntuario';

/**
 * Equivalente ao localStorage do site. Guarda conveniencias do aparelho:
 * rascunho do formulario e a ultima triagem. Nada aqui e fonte da verdade —
 * o que importa vai para o Supabase.
 */
async function ler<T>(chave: string): Promise<T | null> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

async function gravar(chave: string, valor: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem espaco ou storage indisponivel: seguir sem rascunho e melhor que quebrar.
  }
}

export function criarRascunho<T>(chave: string): RascunhoRepository<T> {
  return {
    carregar: () => ler<T>(chave),
    salvar: (valor) => gravar(chave, valor),
    limpar: async () => {
      try {
        await AsyncStorage.removeItem(chave);
      } catch {
        /* nada a fazer */
      }
    },
  };
}

const CHAVE_TRIAGEM = 'ultimaTriagemIA';

export const triagemLocal: TriagemLocalRepository = {
  async recente() {
    const t = await ler<TriagemRecente>(CHAVE_TRIAGEM);
    if (!t) return null;
    // O site descarta depois de 20 minutos: passado isso, a queixa ja e outra.
    return Date.now() - t.quando < VALIDADE_TRIAGEM_MS ? t : null;
  },
  registrar: (triagem) => gravar(CHAVE_TRIAGEM, { ...triagem, quando: Date.now() }),
};

export const CHAVE_RASCUNHO_PRONTUARIO = 'rascunhoPreProntuario';

const CHAVE_RECUPERACAO_SENHA = 'recuperacaoSenhaPendente';

export const recuperacaoSenhaLocal: RecuperacaoSenhaRepository = {
  ativa: async () => (await ler<boolean>(CHAVE_RECUPERACAO_SENHA)) === true,
  marcar: () => gravar(CHAVE_RECUPERACAO_SENHA, true),
  limpar: async () => {
    try {
      await AsyncStorage.removeItem(CHAVE_RECUPERACAO_SENHA);
    } catch {
      /* nada a fazer */
    }
  },
};

/**
 * Tudo o que este arquivo grava pertence ao usuário logado. Toda chave nova
 * precisa entrar nesta lista, senão sobrevive ao logout.
 */
const CHAVES_DO_USUARIO = [CHAVE_RASCUNHO_PRONTUARIO, CHAVE_TRIAGEM, CHAVE_RECUPERACAO_SENHA];

/**
 * Apaga os dados do usuário guardados no aparelho. Chamado no logout: sem isso,
 * quem entrasse depois no mesmo aparelho receberia o pré-prontuário preenchido
 * com CPF e histórico clínico do usuário anterior.
 * A sessão em si não está aqui; quem cuida dela é o supabase-js.
 */
export async function limparDadosLocais(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(CHAVES_DO_USUARIO);
  } catch {
    // Storage indisponível: não há o que apagar, e o logout não pode travar por isso.
  }
}
