export function joinClassNames(...values: readonly (string | false | null | undefined)[]): string {
  return values.filter((value): value is string => Boolean(value)).join(" ");
}

export function joinDescriptionIds(...values: readonly (string | undefined)[]): string | undefined {
  const ids = values.filter((value): value is string => value !== undefined);

  return ids.length > 0 ? ids.join(" ") : undefined;
}
