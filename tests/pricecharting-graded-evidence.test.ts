import test from "node:test";
import assert from "node:assert/strict";
import { PriceChartingClient } from "../lib/providers/pricecharting/PriceChartingClient.ts";

test("PriceCharting screens identity before loading normalized graded evidence", async () => {
  const requests: URL[] = [];
  const request = async (input: string | URL | Request) => {
    const url = new URL(String(input));
    requests.push(url);
    if (url.pathname === "/api/products") return new Response(JSON.stringify({ status: "success", products: [{ id: "123", "product-name": "Pikachu #50", "console-name": "Pokemon Boundaries Crossed" }, { id: "999", "product-name": "Pikachu #99", "console-name": "Other" }] }));
    return new Response(JSON.stringify({ status: "success", id: "123", "product-name": "Pikachu #50", "console-name": "Pokemon Boundaries Crossed", "loose-price": 2200, "graded-price": 5500, "manual-only-price": 12500, "bgs-10-price": 18000, "condition-17-price": 15000, "condition-18-price": 14000 }));
  };
  const evidence = await new PriceChartingClient("secret-token", request as typeof fetch).lookup({ name: "Pikachu", setName: "Boundaries Crossed", collectorNumber: "50/149" });
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].prices["Ungraded"], 2200);
  assert.equal(evidence[0].prices["PSA 10"], 12500);
  assert.equal(requests.length, 2);
  assert.ok(requests.every((url) => url.searchParams.get("t") === "secret-token"));
});
