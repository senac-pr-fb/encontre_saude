-- Episódios e recorrência da pré-triagem.
--
-- episodio_id: liga um relato a um anterior sobre o mesmo problema ("dor de
--   cabeça há 2 h" + "agora febre"). Aponta para o primeiro relato do episódio;
--   null quando o próprio registro é o início. Cada relato continua sendo uma
--   linha: nada é sobrescrito.
-- queixa_rotulo: rótulo curto e padronizado da queixa ("dor de cabeça", "dor no
--   joelho"), para contar recorrência além dos 12 sintomas fixos.
--
-- Só acréscimos: quem não conhece as colunas (o site) continua funcionando.
-- O tipo de episodio_id acompanha o de historico_ia.id, seja bigint ou uuid.

do $$
declare
  tipo_id text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_id
  from pg_attribute a
  where a.attrelid = 'public.historico_ia'::regclass and a.attname = 'id' and not a.attisdropped;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'historico_ia' and column_name = 'episodio_id'
  ) then
    execute format(
      'alter table public.historico_ia add column episodio_id %s references public.historico_ia(id) on delete set null',
      tipo_id
    );
  end if;
end $$;

alter table public.historico_ia add column if not exists queixa_rotulo text;

-- Recorrência e candidatos a episódio: sempre "do usuário, mais recentes primeiro".
create index if not exists historico_ia_user_created_idx on public.historico_ia (user_id, created_at desc);
create index if not exists historico_ia_episodio_idx on public.historico_ia (episodio_id);
