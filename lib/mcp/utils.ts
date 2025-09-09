export function createResult(success: boolean, data?: unknown, error?: string) {
  return {
    success,
    data,
    error,
    executionTime: Date.now(),
  }
}
