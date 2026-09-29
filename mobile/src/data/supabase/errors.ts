import { AuthError, DomainError, NetworkError } from '@domain/errors';

// Mensagens do Supabase Auth vêm em inglês; traduz as que o usuário pode ver.
const MENSAGENS_AUTH: [RegExp, string][] = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar'],
  [/user already registered|already been registered/i, 'Este e-mail já está cadastrado'],
  [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres'],
  [/weak.?password|password is (too )?weak|known to be weak/i, 'Escolha uma senha mais forte'],
  [/rate limit|too many requests/i, 'Muitas tentativas. Aguarde um instante e tente de novo'],
  [/same password/i, 'A nova senha precisa ser diferente da atual'],
  [/auth session missing/i, 'Sessão expirada. Faça login novamente'],
  [/signups? not allowed|signup is disabled/i, 'Cadastro indisponível no momento'],
  [/unable to validate email|invalid format|email address .* is invalid/i, 'Informe um e-mail válido'],
];

// O texto cru do Supabase/PostgREST pode revelar tabelas, colunas e constraints:
// o usuário vê só a mensagem genérica, e o detalhe fica no log de desenvolvimento.
const FALHA_AUTH = 'Não foi possível concluir a operação. Tente novamente.';
const FALHA_DADOS = 'Não foi possível acessar seus dados agora. Tente novamente.';

const isNetwork = (msg: string) => /network request failed|fetch failed|failed to fetch/i.test(msg);

export function toAuthError(e: { message: string }): AuthError | NetworkError {
  if (isNetwork(e.message)) return new NetworkError();
  const traduzida = MENSAGENS_AUTH.find(([re]) => re.test(e.message))?.[1];
  if (!traduzida && __DEV__) console.log('[auth] erro sem tradução:', e.message);
  return new AuthError(traduzida ?? FALHA_AUTH);
}

export function toDomainError(e: { message: string; code?: string }): DomainError {
  if (isNetwork(e.message)) return new NetworkError();
  if (__DEV__) console.log('[supabase] erro:', e.code, e.message);
  // O código continua disponível para o app decidir o que fazer; só o texto é genérico.
  return new DomainError(FALHA_DADOS, e.code ?? 'SUPABASE');
}
