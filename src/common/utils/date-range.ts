const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The server always works in UTC (Postgres timestamps have no offset;
 * `America/Bogota` conversion belongs to the client). A bare `YYYY-MM-DD`
 * `endDate` would otherwise resolve to 00:00:00.000Z, cutting off nearly the
 * entire last day of the range. If the caller wants an exact boundary
 * instant, pass a full ISO datetime instead of a bare date.
 */
export function parseRangeEnd(value: string): Date {
  return DATE_ONLY_REGEX.test(value)
    ? new Date(`${value}T23:59:59.999Z`)
    : new Date(value);
}

export function parseRangeStart(value: string): Date {
  return new Date(value);
}
