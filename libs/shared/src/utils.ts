/**
 * Parses a string field (e.g. from FormData) into a typed integer value:
 *   - undefined          → undefined  (field was not sent)
 *   - '' or '__none__'   → null       (field was sent empty or sentinel, meaning "unassign")
 *   - '42'               → 42         (valid integer)
 *   - any non-numeric    → null       (treated as "unassign")
 */
export function parseFormInt(
  value: string | undefined,
): number | null | undefined {
  if (value === undefined) return undefined;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return null;
  return parsed;
}
