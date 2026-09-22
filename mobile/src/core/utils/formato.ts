/** Mascaras de exibicao. O dominio guarda sempre os valores crus. */

export const soDigitos = (v: string) => v.replace(/\D/g, '');

/** 12345678901 -> 123.456.789-01 (mesma mascara do site) */
export function mascararCPF(valor: string): string {
  const v = soDigitos(valor).slice(0, 11);
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return v;
}

/** 11987654321 -> (11) 98765-4321 */
export function mascararTelefone(valor: string): string {
  const v = soDigitos(valor).slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  if (v.length > 0) return v.replace(/(\d{1,2})/, '($1');
  return v;
}

/** 2001-04-25 -> 25/04/2001 */
export function dataParaBR(iso: string | null): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '';
}

/** 25/04/2001 -> 2001-04-25 (retorna o texto cru se ainda incompleto) */
export function dataParaISO(br: string): string {
  const v = soDigitos(br).slice(0, 8);
  if (v.length < 8) return br;
  const dia = v.slice(0, 2);
  const mes = v.slice(2, 4);
  const ano = v.slice(4, 8);
  return `${ano}-${mes}-${dia}`;
}

/** Aplica a mascara dd/mm/aaaa enquanto o usuario digita. */
export function mascararData(valor: string): string {
  const v = soDigitos(valor).slice(0, 8);
  if (v.length > 4) return v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
  return v;
}

/**
 * Data ISO (AAAA-MM-DD) que existe de fato no calendario e serve como
 * nascimento: rejeita 31/02, ano irreal e datas no futuro.
 */
export function ehDataNascimentoValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (ano < 1900 || ano > new Date().getFullYear()) return false;
  if (mes < 1 || mes > 12) return false;

  const d = new Date(Date.UTC(ano, mes - 1, dia));
  // getUTCDate difere do dia informado quando o mes nao tem aquele dia (31/02 -> 03/03)
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return false;

  return d.getTime() <= Date.now();
}
