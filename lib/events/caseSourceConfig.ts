type CaseSourceEnvironment = Record<string, string | undefined>;

function validatedGoogleSheetUrl(value: string | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "docs.google.com" ||
      url.username ||
      url.password ||
      !/^\/spreadsheets\/d\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)
    ) {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function getCaseSourceSheetUrl(
  environment: CaseSourceEnvironment = process.env,
): string | null {
  return validatedGoogleSheetUrl(
    environment.PHRONESIS_CASE_SOURCE_SHEET_URL ??
      environment.NEXT_PUBLIC_EVENT_INVENTORY_TEMPLATE_URL,
  );
}
