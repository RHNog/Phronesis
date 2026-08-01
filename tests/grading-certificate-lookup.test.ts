import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  certificateLookupProvider,
  normalizeCertificateNumber,
} from "../lib/intelligence/certification/CertificateLookupRegistry";
import {
  PsaCertificateLookup,
  normalizePsaCertificateResponse,
} from "../lib/intelligence/certification/PsaCertificateLookup";

test("grader-specific certificate validation is bounded", () => {
  assert.equal(normalizeCertificateNumber("PSA", " 12345678 "), "12345678");
  assert.equal(normalizeCertificateNumber("TAG", "12345678"), "12345678");
  assert.equal(normalizeCertificateNumber("TAG", "1234567"), null);
  assert.equal(normalizeCertificateNumber("SGC", "1234567-001"), "1234567-001");
  assert.equal(certificateLookupProvider("BECKETT")?.capability, "OFFICIAL_API_REQUIRED");
  assert.equal(certificateLookupProvider("CGC")?.capability, "OFFICIAL_API_REQUIRED");
});

test("PSA response normalization preserves official evidence without inference", () => {
  const result = normalizePsaCertificateResponse("12345678", {
    IsValidRequest: true,
    ServerMessage: "Request successful",
    PSACert: {
      CertNumber: "12345678",
      CardGrade: "10",
      Year: "2023",
      Brand: "Pokemon",
      Subject: "Charizard ex",
      Variety: "Special Illustration Rare",
      LabelType: "PSA",
      SpecID: 99123,
      ImageURL: "https://images.psacard.com/example/front.jpg",
    },
  });
  assert.equal(result.status, "VERIFIED");
  assert.equal(result.grade, "10");
  assert.equal(result.title, "2023 · Pokemon · Charizard ex · Special Illustration Rare");
  assert.deepEqual(result.images, ["https://images.psacard.com/example/front.jpg"]);

  const missing = normalizePsaCertificateResponse("12345678", {
    IsValidRequest: true,
    ServerMessage: "No data found",
  });
  assert.equal(missing.status, "NOT_FOUND");
  assert.equal(missing.grade, null);
});

test("PSA adapter calls only the official endpoint and keeps bearer credentials server-side", async () => {
  let requestUrl = "";
  let authorization = "";
  const lookup = new PsaCertificateLookup("server-secret", async (input, init) => {
    requestUrl = String(input);
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return Response.json({
      IsValidRequest: true,
      ServerMessage: "Request successful",
      PSACert: { CertNumber: "12345678", Grade: "9", Subject: "Pikachu" },
    });
  });
  const result = await lookup.lookup("12345678");
  assert.equal(requestUrl, "https://api.psacard.com/publicapi/cert/GetByCertNumber/12345678");
  assert.equal(authorization, "bearer server-secret");
  assert.equal(result.status, "VERIFIED");
  assert.doesNotMatch(JSON.stringify(result), /server-secret/);
});

test("unsupported graders return an API-authorization state without automated lookup code", () => {
  const route = readFileSync(new URL("../app/api/grading/certificates/route.ts", import.meta.url), "utf8");
  assert.match(route, /OFFICIAL_API_REQUIRED/);
  assert.match(route, /No automated request was made/);
  assert.match(route, /provider\.capability !== "NATIVE_API"/);
  assert.ok(route.indexOf("provider.capability") < route.indexOf("new PsaCertificateLookup"));
});
