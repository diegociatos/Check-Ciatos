// Shared contract for the management form and the privileged update endpoint.
export const userUpdateFields = [
  'Nome', 'Role', 'Status', 'Time', 'Gestor', 'Telefone', 'DataNascimento',
  'Endereco', 'Bio', 'Foto',
] as const;

export function userUpdatePayload(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(userUpdateFields.filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]]));
}
