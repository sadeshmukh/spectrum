import { join, dirname } from "path";
import { fileURLToPath } from "url";

export function getOutputPath(): string {
  const customOutput = process.env.SCRAPED_ITEMS_OUTPUT;
  if (customOutput) {
    return customOutput;
  }

  return join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "db",
    "scraped-items.ts"
  );
}
