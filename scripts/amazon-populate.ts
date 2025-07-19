import { scrapeAmazonPrice } from "../src/lib/amazon-scraper";
import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pLimit from "p-limit";

// WARNING: this script is against Amazon's TOS
// I wasn't careful enough and got my IP banned, I believe

const SEARCH_TERMS = [
  "yoga mat",
  "running shoes",
  "coffee maker",
  "wireless earbuds",
  "desk lamp",
  "backpack",
  "water bottle",
  "bluetooth speaker",
  "air fryer",
  "gaming mouse",
  "plant pot",
  "kitchen knife",
  "throw blanket",
  "protein powder",
  "book stand",
];

const CONCURRENCY = 3;
const limit = pLimit(CONCURRENCY);

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function delay(min: number, max: number) {
  const delayTime = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, delayTime));
}

async function longerDelay() {
  const delayTime = 15000 + Math.random() * 30000;
  return new Promise((resolve) => setTimeout(resolve, delayTime));
}

async function generateSearchUrls(count = 50) {
  return Array.from({ length: count }, () => {
    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    return `https://www.amazon.com/s?k=${encodeURIComponent(term)}`;
  });
}

async function extractProductUrls(searchUrl: string): Promise<string[]> {
  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Ch-Ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        Referer: "https://www.amazon.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const html = await response.text();

    const urlSet = new Set<string>();

    const asinMatches = html.match(/data-asin="([A-Z0-9]{10})"/g) || [];

    for (const match of asinMatches) {
      const asin = match.match(/data-asin="([A-Z0-9]{10})"/)![1];
      urlSet.add(`https://www.amazon.com/dp/${asin}`);
    }

    const linkMatches = html.matchAll(
      /href="(\/[^"]*\/(?:dp|gp\/product|exec\/obidos\/ASIN)\/[A-Z0-9]{10}[^"]*)"/g
    );
    for (const [, path] of linkMatches) {
      urlSet.add(`https://www.amazon.com${path.split("?")[0]}`);
    }

    const urls = [...urlSet].slice(0, 5);
    return urls;
  } catch (error) {
    console.error(`Failed to extract products from ${searchUrl}:`, error);
    return [];
  }
}

interface ScrapedItem {
  link: string;
  photoUrl: string | undefined;
  title: string | undefined;
  actualPrice: number | undefined;
}

interface ScrapedResult {
  link: string;
  photoUrl: string | undefined;
  title: string | undefined;
  actualPrice: number | undefined;
}

async function scrapeProduct(productUrl: string): Promise<ScrapedItem | null> {
  try {
    await delay(5000, 15000);

    const result = await scrapeAmazonPrice(productUrl);

    if (result.success && result.data) {
      const { title, price, image: photoUrl } = result.data;
      return {
        link: productUrl,
        photoUrl: photoUrl || undefined,
        title: title || undefined,
        actualPrice: price || undefined,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Failed to process product ${productUrl}:`, error);
    return null;
  }
}

async function processSearchUrl(
  searchUrl: string,
  items: ScrapedItem[],
  stats: { success: number; failure: number }
) {
  try {
    const productUrls = await extractProductUrls(searchUrl);

    if (productUrls.length === 0) {
      return;
    }

    const scrapePromises = productUrls.map((url) =>
      limit(() => scrapeProduct(url))
    );

    const results = await Promise.all(scrapePromises);

    const successfulItems = results.filter(
      (item): item is ScrapedItem => item !== null
    );

    items.push(...successfulItems);
    stats.success += successfulItems.length;
    stats.failure += results.length - successfulItems.length;

    await longerDelay();
  } catch (error) {
    console.error(`Failed to process search ${searchUrl}:`, error);
    stats.failure++;
  }
}

async function scrapeProducts() {
  const stats = { success: 0, failure: 0 };
  const items: ScrapedItem[] = [];

  const searchUrls = await generateSearchUrls(3);

  const searchPromises = searchUrls.map((searchUrl) =>
    limit(() => processSearchUrl(searchUrl, items, stats))
  );

  await Promise.all(searchPromises);

  return items;
}

async function writeScrapedData(items: ScrapedItem[]) {
  const validItems = items.filter((item) => {
    const isValid = item.title && item.actualPrice && item.actualPrice > 0;
    return isValid;
  });

  const outputPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "db",
    "scraped-items.ts"
  );
  const fileContent = `export const scrapedItems = ${JSON.stringify(
    validItems,
    null,
    2
  )} as const;
`;

  await writeFile(outputPath, fileContent, "utf-8");
}

async function main() {
  try {
    const mainLimit = pLimit(CONCURRENCY);
    const items: ScrapedItem[] = [];
    const stats = { success: 0, failure: 0 };

    const searchUrls = await generateSearchUrls(3);

    for (const searchUrl of searchUrls) {
      try {
        const productUrls = await extractProductUrls(searchUrl);

        if (productUrls.length === 0) {
          continue;
        }

        const productPromises = productUrls.map((url) =>
          mainLimit(async () => {
            try {
              await delay(5000, 15000);
              const result = await scrapeAmazonPrice(url);

              if (result.success && result.data) {
                const { title, price, image: photoUrl } = result.data;
                return {
                  link: url,
                  photoUrl: photoUrl || undefined,
                  title: title || undefined,
                  actualPrice: price || undefined,
                };
              } else {
                return null;
              }
            } catch (error) {
              console.error(`Error scraping ${url}:`, error);
              return null;
            }
          })
        );

        const results = await Promise.all(productPromises);

        const successfulItems = results.filter(
          (item): item is ScrapedResult => item !== null
        );
        const validItems = successfulItems.map((item) => ({
          link: item.link,
          photoUrl: item.photoUrl,
          title: item.title,
          actualPrice: item.actualPrice,
        }));

        items.push(...validItems);
        stats.success += successfulItems.length;
        stats.failure += results.length - successfulItems.length;

        await longerDelay();
      } catch (searchError) {
        console.error(`Error processing search ${searchUrl}:`, searchError);
        stats.failure++;
      }
    }

    if (items.length === 0) {
      throw new Error("No items were collected");
    }

    const validItems = items.filter((item) => {
      const isValid = item.title && item.actualPrice && item.actualPrice > 0;
      return isValid;
    });

    if (validItems.length === 0) {
      throw new Error("No valid items to write");
    }

    const outputPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "db",
      "scraped-items.ts"
    );

    const fileContent = `export const scrapedItems = ${JSON.stringify(
      validItems,
      null,
      2
    )} as const;
`;

    await writeFile(outputPath, fileContent, "utf-8");
  } catch (error) {
    console.error("=== Fatal Error ===");
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("=== Unhandled Error ===");
  console.error(error);
  process.exit(1);
});
