import { env } from '@core/config/env';
import { NetworkError, DomainError } from '@domain/errors';
import { ok, err, type Result } from '@core/utils/result';

/**
 * Acesso ao Firestore pela API REST, com `fetch`.
 *
 * Por que não o SDK do Firebase: o catálogo de farmácias é público e só de
 * leitura. O SDK acrescentaria ~200 KB ao bundle, um segundo runtime de
 * autenticação e os problemas conhecidos de long-polling em React Native, sem
 * trazer nada que precisemos — cache quem faz é o TanStack Query. Se um dia
 * houver escrita ou tempo real, troca-se esta implementação sem tocar no resto.
 */
const BASE = 'https://firestore.googleapis.com/v1';

export interface FirestoreDoc {
  /** projects/.../documents/<colecao>/<id> */
  name: string;
  fields: Record<string, FirestoreValue>;
}

export type FirestoreValue =
  | { stringValue: string }
  | { doubleValue: number }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { geoPointValue: { latitude: number; longitude: number } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

interface RespostaLista {
  documents?: FirestoreDoc[];
  nextPageToken?: string;
}

/** Lê uma coleção inteira, seguindo a paginação. */
export async function listarColecao(colecao: string): Promise<Result<FirestoreDoc[], DomainError>> {
  const docs: FirestoreDoc[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const url = new URL(`${BASE}/projects/${env.firebaseProjectId}/databases/(default)/documents/${colecao}`);
      url.searchParams.set('key', env.firebaseApiKey);
      url.searchParams.set('pageSize', '300');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const corpo = await res.json().catch(() => null);
        const msg = corpo?.error?.message ?? `Erro ${res.status} ao consultar o Firestore`;
        // Regras do Firestore negando leitura pública
        if (res.status === 403) {
          return err(new DomainError('Sem permissão para ler as farmácias', 'FIRESTORE_PERMISSION'));
        }
        return err(new DomainError(msg, 'FIRESTORE'));
      }

      const json: RespostaLista = await res.json();
      docs.push(...(json.documents ?? []));
      pageToken = json.nextPageToken;
    } while (pageToken);

    return ok(docs);
  } catch {
    return err(new NetworkError('Não foi possível carregar as farmácias'));
  }
}

/** O id do documento é o último segmento de `name`. */
export const idDoDocumento = (name: string) => name.split('/').pop() ?? name;

export function texto(v: FirestoreValue | undefined): string | null {
  if (!v || 'nullValue' in v) return null;
  if ('stringValue' in v) {
    const s = v.stringValue.trim();
    return s === '' ? null : s;
  }
  return null;
}

export function numero(v: FirestoreValue | undefined): number | null {
  if (!v || 'nullValue' in v) return null;
  if ('doubleValue' in v) return v.doubleValue;
  if ('integerValue' in v) return Number(v.integerValue);
  return null;
}

export function geoPonto(v: FirestoreValue | undefined): { lat: number; lng: number } | null {
  if (v && 'geoPointValue' in v) return { lat: v.geoPointValue.latitude, lng: v.geoPointValue.longitude };
  return null;
}
