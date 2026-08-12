// Selects the capture provider from env. Add new vendors (Urlbox, ScrapingBee,
// a self-hosted Playwright worker) by implementing CaptureProvider and wiring a
// case here — nothing else in the pipeline changes.

import type { CaptureProvider } from "./types.ts";
import { createMockProvider } from "./mock.ts";
import { createBrowserlessProvider } from "./browserless.ts";

export function selectProvider(): CaptureProvider {
  const name = (Deno.env.get("CAPTURE_PROVIDER") ?? "mock").toLowerCase();

  switch (name) {
    case "browserless": {
      const url = Deno.env.get("BROWSERLESS_URL");
      const token = Deno.env.get("BROWSERLESS_TOKEN");
      if (!url || !token) throw new Error("browserless: set BROWSERLESS_URL and BROWSERLESS_TOKEN");
      return createBrowserlessProvider({ url, token });
    }
    case "mock":
      return createMockProvider();
    default:
      throw new Error(`Unknown CAPTURE_PROVIDER "${name}"`);
  }
}
