// Substitui o padrão { data, error } dos Services do site por um tipo discriminado.

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Para queryFn/mutationFn do TanStack Query, que esperam throw em caso de erro. */
export function unwrap<T, E extends Error>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw r.error;
}
