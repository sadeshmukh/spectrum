interface BestBuyProduct {
  title: string;
  price: number | null;
  currency: string;
  image: string | null;
}

import { USER_AGENT } from "./constants";

interface ScrapingResult {
  success: boolean;
  data: BestBuyProduct | null;
  error: string | null;
}

const USER_AGENTS = [
  USER_AGENT,
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
];

export async function scrapeBestBuyPrice(
  url: string,
  retries = 2
): Promise<ScrapingResult> {
  try {
    if (!isValidBestBuyUrl(url)) {
      return { success: false, data: null, error: "Invalid BestBuy URL" };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            Connection: "keep-alive",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            DNT: "1",
            "Upgrade-Insecure-Requests": "1",
          },
        });

        if (!response.ok) {
          if (attempt < retries) continue;
          return {
            success: false,
            data: null,
            error: `HTTP error: ${response.status}`,
          };
        }

        const html = await response.text();

        if (html.includes("Access Denied") || html.includes("blocked")) {
          if (attempt < retries) continue;
          return {
            success: false,
            data: null,
            error: "Rate limited by BestBuy",
          };
        }

        const product = await parseBestBuyHTML(html);
        if (!product.title && !product.price) {
          if (attempt < retries) continue;
          return {
            success: false,
            data: null,
            error: "Failed to extract product data",
          };
        }

        return { success: true, data: product, error: null };
      } catch (error) {
        if (attempt < retries) continue;
        throw error;
      }
    }

    return { success: false, data: null, error: "Max retries exceeded" };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function isValidBestBuyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const validDomains = ["bestbuy.com", "www.bestbuy.com"];

    return (
      validDomains.includes(parsed.hostname) &&
      (parsed.pathname.includes("/site/") ||
        parsed.pathname.includes("/p/") ||
        parsed.pathname.includes("/product/"))
    );
  } catch {
    return false;
  }
}

async function parseBestBuyHTML(html: string): Promise<BestBuyProduct> {
  const product: BestBuyProduct = {
    title: "",
    price: null,
    currency: "USD",
    image: null,
  };

  // Extract title
  const titleMatch =
    html.match(/<h1[^>]*class="[^"]*heading[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    product.title = decodeHTMLEntities(titleMatch[1].trim());
  }

  // Extract price using multiple patterns
  const pricePatterns = [
    /class="[^"]*price[^"]*"[^>]*>[\s]*\$?([\d,]+\.?\d*)/i,
    /class="[^"]*amount[^"]*"[^>]*>[\s]*\$?([\d,]+\.?\d*)/i,
    /data-price="([\d,]+\.?\d*)"/i,
    /price[^>]*>[\s]*\$?([\d,]+\.?\d*)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const priceText = match[1].trim();
      const price = parsePrice(priceText);
      if (price) {
        product.price = price.amount;
        product.currency = price.currency;
        break;
      }
    }
  }

  // bestbuy uses URL parameters to determine image size
  const imagePattern =
    /src="(https:\/\/pisces\.bbystatic\.com\/image2\/BestBuy_US\/images\/products\/[^"]+\.jpg[^"]*)"/gi;

  const allMatches = [...html.matchAll(imagePattern)];

  const sortedImages = allMatches
    .map((match) => match[1])
    .filter((url) => {
      const heightMatch = url.match(/maxHeight=(\d+)/);
      return heightMatch && parseInt(heightMatch[1]) > 128;
    })
    .sort((a, b) => {
      const heightA = parseInt(a.match(/maxHeight=(\d+)/)?.[1] || "0");
      const heightB = parseInt(b.match(/maxHeight=(\d+)/)?.[1] || "0");
      return heightB - heightA;
    });

  if (sortedImages.length > 0) {
    product.image = sortedImages[0];
  }

  return product;
}

function decodeHTMLEntities(text: string): string {
  const htmlEntities: { [key: string]: string } = {
    "&quot;": '"',
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&apos;": "'",
    "&nbsp;": " ",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&hellip;": "…",
    "&mdash;": "—",
    "&ndash;": "–",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
  };

  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
}

function parsePrice(
  priceText: string
): { amount: number; currency: string } | null {
  try {
    const cleanText = priceText.replace(/[^\d.,]/g, "").replace(/,/g, ".");
    const amount = parseFloat(cleanText);
    if (isNaN(amount)) return null;

    let currency = "USD";
    if (priceText.includes("£")) currency = "GBP";
    else if (priceText.includes("€")) currency = "EUR";
    else if (priceText.includes("¥")) currency = "JPY";
    else if (priceText.includes("$")) {
      if (priceText.includes("CA")) currency = "CAD";
      else if (priceText.includes("AU")) currency = "AUD";
    }

    return { amount, currency };
  } catch {
    return null;
  }
}

export function extractSKU(url: string): string | null {
  const match = url.match(/(?:site|p|product)\/([A-Z0-9]+)/);
  return match ? match[1] : null;
}

export function buildBestBuyUrl(sku: string): string {
  return `https://www.bestbuy.com/site/${sku}`;
}
