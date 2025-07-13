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
  availability: string;
  rating: number | null;
  reviewCount: number | null;
}

interface ScrapingResult {
  success: boolean;
  data: AmazonProduct | null;
  error: string | null;
}

/**
 * Extracts price from Amazon product page
 * @param url - Amazon product URL
 * @returns Promise<ScrapingResult>
 */
export async function scrapeAmazonPrice(url: string): Promise<ScrapingResult> {
  try {
    if (!isValidAmazonUrl(url)) {
      return {
        success: false,
        data: null,
        error: "Invalid Amazon URL provided",
      };
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP error: ${response.status}`,
      };
    }

    const html = await response.text();

    const productData = parseAmazonHTML(html);

    return {
      success: true,
      data: productData,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
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

/**
 * extract product information from amazon html
 */
function parseAmazonHTML(html: string): AmazonProduct {
  const priceSelectors = [
    ".a-price-whole",
    ".a-price .a-offscreen",
    "#priceblock_dealprice",
    "#priceblock_ourprice",
    ".a-price-range",
    ".a-price.a-text-price.a-size-medium.apexPriceToPay",
    ".a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen",
    ".a-price.a-text-price.a-size-large.apexPriceToPay .a-offscreen",
    ".a-price.a-text-price.a-size-medium.apexPriceToPay .a-price-whole",
    ".a-price.a-text-price.a-size-large.apexPriceToPay .a-price-whole",
  ];

  const titleSelectors = [
    "#productTitle",
    ".product-title",
    "h1.a-size-large",
    "h1.a-size-base-plus",
  ];

  const imageSelectors = [
    "#landingImage",
    "#imgBlkFront",
    ".a-dynamic-image",
    ".a-spacing-small img",
  ];

  const ratingSelectors = [
    ".a-icon-alt",
    ".a-icon.a-icon-star .a-icon-alt",
    ".reviewCountTextLinkedHistogram .a-declarative .a-link-normal",
  ];

  const availabilitySelectors = [
    "#availability span",
    ".a-color-success",
    ".a-color-state",
    ".a-color-price",
  ];

  const product: AmazonProduct = {
    title: "",
    price: null,
    currency: "USD",
    image: null,
    availability: "",
    rating: null,
    reviewCount: null,
  };

  // extract title
  for (const selector of titleSelectors) {
    const match = html.match(
      new RegExp(`<[^>]*id="${selector.replace("#", "")}"[^>]*>([^<]*)</`, "i")
    );
    if (match) {
      product.title = cleanText(match[1]);
      break;
    }
  }

  // Extract price
  const priceText = extractPrice(html, priceSelectors);
  if (priceText) {
    const price = parsePrice(priceText);
    if (price) {
      product.price = price.amount;
      product.currency = price.currency;
    }
  }

  // Extract image
  for (const selector of imageSelectors) {
    const match = html.match(
      new RegExp(
        `<[^>]*id="${selector.replace("#", "")}"[^>]*src="([^"]*)"`,
        "i"
      )
    );
    if (match) {
      product.image = match[1];
      break;
    }
  }

  // Extract availability
  for (const selector of availabilitySelectors) {
    const match = html.match(
      new RegExp(
        `<[^>]*class="[^"]*${selector.replace(".", "")}[^"]*"[^>]*>([^<]*)</`,
        "i"
      )
    );
    if (match) {
      product.availability = cleanText(match[1]);
      break;
    }
  }

  // Extract rating
  const ratingMatch = html.match(/(\d+\.?\d*)\s*out of\s*5\s*stars/i);
  if (ratingMatch) {
    product.rating = parseFloat(ratingMatch[1]);
  }

  // Extract review count
  const reviewMatch = html.match(/(\d+(?:,\d+)*)\s*(?:customer\s*)?reviews?/i);
  if (reviewMatch) {
    product.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""));
  }

  return product;
}

function extractPrice(html: string, selectors: string[]): string | null {
  for (const selector of selectors) {
    const className = selector.replace(".", "");
    const patterns = [
      new RegExp(`<[^>]*class="[^"]*${className}[^"]*"[^>]*>([^<]*)</`, "i"),
      new RegExp(
        `<[^>]*class="[^"]*${className}[^"]*"[^>]*>.*?<[^>]*>([^<]*)</`,
        "i"
      ),
      new RegExp(
        `<span[^>]*class="[^"]*${className}[^"]*"[^>]*>([^<]*)</span>`,
        "i"
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const text = cleanText(match[1]);
        if (text.match(/[\d,]+\.?\d*/)) {
          return text;
        }
      }
    }
  }

  // just search for random price pattern
  const fallbackPattern = /[\$£€¥₹]\s*(\d+(?:,\d+)*(?:\.\d+)?)/g;
  const fallbackMatch = html.match(fallbackPattern);
  if (fallbackMatch && fallbackMatch[0]) {
    console.log("fallback detected");
    console.log("fallbackMatch", fallbackMatch[0]);
    return fallbackMatch[0];
  }

  return null;
}

/**
 * Extracts amount and currency from price text
 */
function parsePrice(
  priceText: string
): { amount: number; currency: string } | null {
  const cleaned = priceText.replace(/[^\d.,\$£€¥₹]/g, "");

  let currency = "USD";

  if (cleaned.includes("£")) {
    currency = "GBP";
  } else if (cleaned.includes("€")) {
    currency = "EUR";
  } else if (cleaned.includes("¥")) {
    currency = "JPY";
  } else if (cleaned.includes("₹")) {
    currency = "INR";
  }

  if (currency !== "USD") {
    console.log("Non-dollar currency acquired - check host??");
  }

  const numericMatch = cleaned.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
  if (numericMatch) {
    const amount = parseFloat(numericMatch[1].replace(/,/g, ""));
    return { amount, currency };
  }

  return null;
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export async function scrapeManyAmazon(
  urls: string[]
): Promise<ScrapingResult[]> {
  const results: ScrapingResult[] = [];

  for (const url of urls) {
    const result = await scrapeAmazonPrice(url);
    results.push(result);

    // rate limits!
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

export function extractASIN(url: string): string | null {
  const asinMatch = url.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
  return asinMatch ? asinMatch[1] : null;
}

export function buildAmazonUrl(
  asin: string,
  domain: string = "amazon.com"
): string {
  return `https://www.${domain}/dp/${asin}`;
}
