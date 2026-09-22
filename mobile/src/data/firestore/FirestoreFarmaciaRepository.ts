import type { FarmaciaRepository } from '@domain/repositories/FarmaciaRepository';
import type { Farmacia, TipoFarmacia } from '@domain/entities/Farmacia';
import { TIPOS_FARMACIA } from '@domain/entities/Farmacia';
import type { DomainError } from '@domain/errors';
import { ok, type Result } from '@core/utils/result';
import { geoPonto, idDoDocumento, listarColecao, numero, texto, type FirestoreDoc } from './client';

const COLECAO = 'pharmacies';

/**
 * Normaliza o `tipo`: no Firestore ele vem capitalizado ("Privada", "Municipal"),
 * enquanto o site compara em minúsculas. Aceita as duas formas.
 */
function lerTipo(valor: string | null): TipoFarmacia {
  const normalizado = (valor ?? '').trim().toLowerCase();
  return TIPOS_FARMACIA.find((t) => t.toLowerCase() === normalizado) ?? 'Privada';
}

/** Descarta documentos sem o mínimo para aparecer no mapa (nome e coordenadas). */
function paraFarmacia(doc: FirestoreDoc): Farmacia | null {
  const f = doc.fields ?? {};
  const nome = texto(f.nome);
  // Os 53 documentos têm lat/lng e location coerentes; location fica de reserva.
  const geo = geoPonto(f.location);
  const lat = numero(f.lat) ?? geo?.lat ?? null;
  const lng = numero(f.lng) ?? geo?.lng ?? null;

  if (!nome || lat === null || lng === null) return null;

  return {
    id: idDoDocumento(doc.name),
    nome,
    endereco: texto(f.endereco),
    bairro: texto(f.bairro) ?? 'Sem bairro',
    telefone: texto(f.telefone),
    horario: texto(f.horario),
    site: texto(f.site),
    instagram: texto(f.instagram),
    tipo: lerTipo(texto(f.tipo)),
    lat,
    lng,
  };
}

export class FirestoreFarmaciaRepository implements FarmaciaRepository {
  async listar(): Promise<Result<Farmacia[], DomainError>> {
    const docs = await listarColecao(COLECAO);
    if (!docs.ok) return docs;

    const farmacias = docs.value
      .map(paraFarmacia)
      .filter((f): f is Farmacia => f !== null)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    return ok(farmacias);
  }
}
