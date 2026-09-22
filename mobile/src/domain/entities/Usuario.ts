export interface Usuario {
  id: string;
  email: string;
  /** user_metadata.full_name — preenchido pelo Google; null no cadastro por e-mail. */
  nome: string | null;
}
