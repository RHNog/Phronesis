export const ACCOUNT_SIGN_UP_PATH = "/sign-up";

export function buildAccountSignUpUrl(
  restrictedPublicOrigin: string | null,
  currentOrigin: string | null,
): string {
  const origin = restrictedPublicOrigin ?? currentOrigin;
  return origin
    ? new URL(ACCOUNT_SIGN_UP_PATH, `${origin}/`).toString()
    : ACCOUNT_SIGN_UP_PATH;
}
