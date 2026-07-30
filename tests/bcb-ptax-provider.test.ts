import assert from "node:assert/strict";
import test from "node:test";
import { BcbPtaxProvider } from "../lib/regional/BcbPtaxProvider.ts";

test("BCB PTAX provider selects the latest closing quotation and preserves both sides", async () => {
  let requested = "";
  const provider = new BcbPtaxProvider(
    async (input) => {
      requested = String(input);
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            value: [
              {
                cotacaoCompra: 5.08,
                cotacaoVenda: 5.09,
                dataHoraCotacao: "2026-07-29 13:08:43.534984",
              },
              {
                cotacaoCompra: 5.0733,
                cotacaoVenda: 5.0739,
                dataHoraCotacao: "2026-07-30 13:07:32.344966",
              },
            ],
          };
        },
      };
    },
    () => new Date("2026-07-30T18:00:00.000Z"),
  );
  const quote = await provider.latestClosingQuote();
  assert.equal(quote.buyBrlPerUsd, 5.0733);
  assert.equal(quote.sellBrlPerUsd, 5.0739);
  assert.equal(quote.observedAt, "2026-07-30T16:07:32.344Z");
  assert.equal(quote.fetchedAt, "2026-07-30T18:00:00.000Z");
  assert.match(quote.source, /Banco Central do Brasil PTAX/);
  assert.match(requested, /^https:\/\/olinda\.bcb\.gov\.br\//);
  assert.match(requested, /%40dataInicial=%2707-22-2026%27/);
  assert.match(requested, /%40dataFinalCotacao=%2707-30-2026%27/);
});

test("BCB PTAX provider rejects malformed or inverted quotations", async () => {
  const provider = new BcbPtaxProvider(
    async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          value: [
            {
              cotacaoCompra: 5.2,
              cotacaoVenda: 5.1,
              dataHoraCotacao: "2026-07-30 13:07:32",
            },
          ],
        };
      },
    }),
    () => new Date("2026-07-30T18:00:00.000Z"),
  );
  await assert.rejects(
    provider.latestClosingQuote(),
    /invalid buy\/sell quotations/,
  );
});
