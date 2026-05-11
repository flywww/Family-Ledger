export function getSafeCriticalDatabaseMessage(operation: string) {
  return `Database temporarily unavailable while loading ${operation}. Please try again later.`;
}

export function logAndThrowCriticalDatabaseFailure(operation: string, error: unknown): never {
  console.error("[critical-database-failure]", { operation, error });
  throw new Error(getSafeCriticalDatabaseMessage(operation));
}
