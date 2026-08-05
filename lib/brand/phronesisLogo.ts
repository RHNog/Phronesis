import { readFileSync } from "node:fs";
import { join } from "node:path";

export const phronesisLogoSize = {
  width: 1254,
  height: 1254,
};

export const phronesisLogoContentType = "image/png";

export function phronesisLogoResponse(): Response {
  const bytes = new Uint8Array(
    readFileSync(join(process.cwd(), "public/brand/phronesis-logo.png")),
  );
  return new Response(bytes, {
    headers: {
      "Content-Type": phronesisLogoContentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
