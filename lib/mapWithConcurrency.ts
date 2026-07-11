import "server-only";

// Pool de tamaño fijo: nunca hay más de `limit` llamadas de `fn` en
// vuelo a la vez, a diferencia de Promise.all(items.map(fn)) que las
// dispara todas de una. Usado para no saturar el servicio ML (un solo
// proceso, CPU-bound) cuando se procesa un catálogo grande.
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current], current);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}
