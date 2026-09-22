import { AuthError, DomainError, NetworkError } from '@domain/errors';

// Mensagens do Supabase Auth vêm em inglês; traduz as que o usuário pode ver.
const MENSAGENS_AUTH: [RegExp, string][] = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar'],
  [/user already registered|already been registered/i, 'Este e-mail já está cadastrado'],
  [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres'],
  [/rate limit|too many requests/i, 'Muitas tentativas. Aguarde um instante e tente de novo'],
  [/same password/i, 'A nova senha precisa ser diferente da atual'],
  [/auth session missing/i, 'Sessão expirada. Faça login novamente'],
];

const isNetwork = (msg: string) => /network request failed|fetch failed|failed to fetch/i.test(msg);

export function toAuthError(e: { message: string }): AuthError | NetworkError {
  if (isNetwork(e.message)) return new NetworkError();
  const traduzida = MENSAGENS_AUTH.find(([re]) => re.test(e.message))?.[1];
  return new AuthError(traduzida ?? e.message);
}

export function toDomainError(e: { message: string; code?: string }): DomainError {
  if (isNetwork(e.message)) return new NetworkError();
  return new DomainError(e.message, e.code ?? 'SUPABASE');
}
