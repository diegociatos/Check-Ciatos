// Fail closed before creating a privileged client or parsing the event.
export function webhookAuthStatus(expected: string | undefined, received: string | null): 200 | 401 | 503 {
  if (!expected || !expected.trim()) return 503;
  return received === expected ? 200 : 401;
}
