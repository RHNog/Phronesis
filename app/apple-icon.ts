import {
  phronesisLogoContentType,
  phronesisLogoResponse,
  phronesisLogoSize,
} from "@/lib/brand/phronesisLogo";

export const size = phronesisLogoSize;
export const contentType = phronesisLogoContentType;

export default function AppleIcon() {
  return phronesisLogoResponse();
}
