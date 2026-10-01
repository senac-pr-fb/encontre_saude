-- Segunda rodada da pré-triagem: a Edge Function `triagem` atualiza o registro
-- da primeira rodada (com o JWT do usuário) em vez de criar outro. Para isso o
-- dono precisa de permissão de UPDATE nas próprias linhas.
--
-- Idempotente: só cria a policy se a tabela ainda não tiver nenhuma de UPDATE
-- (ou ALL). Sem ela a função continua funcionando, mas grava um registro novo.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'historico_ia' and cmd in ('UPDATE', 'ALL')
  ) then
    create policy "historico_ia_update_proprio" on public.historico_ia
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sintomas_atendimento' and cmd in ('UPDATE', 'ALL')
  ) then
    create policy "sintomas_atendimento_update_proprio" on public.sintomas_atendimento
      for update to authenticated
      using (exists (select 1 from public.historico_ia h where h.id = historico_id and h.user_id = auth.uid()))
      with check (exists (select 1 from public.historico_ia h where h.id = historico_id and h.user_id = auth.uid()));
  end if;
end $$;
