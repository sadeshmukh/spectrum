import { USER_AGENT } from "./constants";

/**
 * amazon scraper
 * Extracts price information from Amazon product pages
 */

// disclaimer: this file was generated with no small amount of help from Cursor

interface AmazonProduct {
  title: string;
  price: number | null;
  currency: string;
  image: string | null;
}

interface ScrapingResult {
  success: boolean;
  data: AmazonProduct | null;
  error: string | null;
}

const USER_AGENTS = [
  USER_AGENT,
  // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  // "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
];

export async function scrapeAmazonPrice(
  url: string,
  retries = 2
): Promise<ScrapingResult> {
  try {
    if (!isValidAmazonUrl(url)) {
      return { success: false, data: null, error: "Invalid Amazon URL" };
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
        if (
          html.includes(
            "To discuss automated access to Amazon data please contact"
          )
        ) {
          if (attempt < retries) continue;
          return {
            success: false,
            data: null,
            error: "Rate limited by Amazon",
          };
        }

        const product = parseAmazonHTML(html);
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

function isValidAmazonUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const validDomains = [
      "amazon.com",
      "amazon.co.uk",
      "amazon.ca",
      "amazon.de",
      "amazon.fr",
      "amazon.it",
      "amazon.es",
      "amazon.com.au",
      "amazon.co.jp",
      "amazon.in",
    ];

    return (
      validDomains.some(
        (domain) =>
          parsed.hostname === domain ||
          parsed.hostname === `www.${domain}` ||
          parsed.hostname.endsWith(`.${domain}`)
      ) &&
      (parsed.pathname.includes("/dp/") ||
        parsed.pathname.includes("/gp/product/") ||
        parsed.pathname.includes("/exec/obidos/ASIN/"))
    );
  } catch {
    return false;
  }
}

function parseAmazonHTML(html: string): AmazonProduct {
  const product: AmazonProduct = {
    title: "",
    price: null,
    currency: "USD",
    image: null,
  };

  // Extract title
  const titleMatch =
    html.match(/<span\s+id="productTitle"[^>]*>([^<]+)<\/span>/i) ||
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) {
    product.title = titleMatch[1].trim();
  }

  // Extract price using multiple patterns
  const pricePatterns = [
    /class="a-price"[^>]*>[^<]*<span[^>]*>([^<]+)<\/span>/i,
    /class="a-price-whole">([^<]+)<\/span>/i,
    /class="a-offscreen">([^<]+)<\/span>/i,
    /id="priceblock_ourprice"[^>]*>([^<]+)<\/span>/i,
    /id="priceblock_dealprice"[^>]*>([^<]+)<\/span>/i,
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

  // Extract image
  const imageMatch =
    html.match(/id="landingImage"[^>]*src="([^"]+)"/i) ||
    html.match(/id="imgBlkFront"[^>]*src="([^"]+)"/i);
  if (imageMatch) {
    product.image = imageMatch[1];
  }

  return product;
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
    else if (priceText.includes("₹")) currency = "INR";
    else if (priceText.includes("$")) {
      if (priceText.includes("CA")) currency = "CAD";
      else if (priceText.includes("AU")) currency = "AUD";
    }

    return { amount, currency };
  } catch {
    return null;
  }
}

export function extractASIN(url: string): string | null {
  const match = url.match(/(?:dp|product|ASIN)\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

export function buildAmazonUrl(asin: string, domain = "amazon.com"): string {
  return `https://www.${domain}/dp/${asin}`;
}
