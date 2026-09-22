import { z } from 'zod';

// Compartilhado entre use cases (validação) e formulários (react-hook-form).
export const emailSchema = z.email('Informe um e-mail válido').trim().toLowerCase();

export const senhaSchema = z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres');

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Informe a senha'),
});

export const cadastroSchema = z
  .object({
    email: emailSchema,
    senha: senhaSchema,
    confirmarSenha: z.string(),
  })
  .refine((d) => d.senha === d.confirmarSenha, { path: ['confirmarSenha'], message: 'As senhas não coincidem' });

export const recuperarSenhaSchema = z.object({ email: emailSchema });

export const novaSenhaSchema = z
  .object({
    senha: senhaSchema,
    confirmarSenha: z.string(),
  })
  .refine((d) => d.senha === d.confirmarSenha, { path: ['confirmarSenha'], message: 'As senhas não coincidem' });

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;
export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>;
export type NovaSenhaInput = z.infer<typeof novaSenhaSchema>;
