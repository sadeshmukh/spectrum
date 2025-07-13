import React, { useState } from "react";

interface AmazonProduct {
  title: string;
  price: number | null;
  currency: string;
  image: string | null;
  availability: string;
  rating: number | null;
  reviewCount: number | null;
}

interface ProductWithUrl extends AmazonProduct {
  url: string;
}

type ViewState = "idle" | "loading" | "preview" | "error";

export default function AmazonScraper() {
  const [url, setUrl] = useState("");
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [productData, setProductData] = useState<ProductWithUrl | null>(null);
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleScrape = async () => {
    if (!url.includes("amazon.")) {
      setError("Not an Amazon URL");
      setViewState("error");
      return;
    }

    setViewState("loading");

    try {
      const response = await fetch("/api/scrape-amazon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setProductData({ ...result.data, url });
        setViewState("preview");
      } else {
        setError(result.error || "Failed to scrape product data");
        setViewState("error");
      }
    } catch (error) {
      console.error("Scraping error:", error);
      setError("Network error");
      setViewState("error");
    }
  };

  const handleConfirm = async () => {
    if (!productData) return;

    setIsConfirming(true);

    try {
      const response = await fetch("/api/add-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: productData.url,
          title: productData.title,
          price: productData.price,
          currency: productData.currency,
          image: productData.image,
          availability: productData.availability,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `item added!\n\n${productData.title}\nextracted price: ${productData.currency} ${productData.price}`
        );
        handleCancel();
      } else {
        setError(result.error || "Failed to save");
        setViewState("error");
      }
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save");
      setViewState("error");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setUrl("");
    setProductData(null);
    setViewState("idle");
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScrape();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Paste Amazon product URL here..."
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
        <button
          onClick={handleScrape}
          disabled={viewState === "loading"}
          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-600 text-black px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          {viewState === "loading" ? "Scraping..." : "Scrape"}
        </button>
      </div>

      {viewState === "loading" && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <span className="ml-3 text-gray-400">Scraping...</span>
        </div>
      )}

      {viewState === "error" && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {viewState === "preview" && productData && (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
              {productData.image ? (
                <img
                  src={productData.image}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium text-sm mb-1">
                {productData.title || "Product title not found"}
              </h4>
              <p className="text-yellow-500 font-bold text-lg mb-2">
                {productData.price
                  ? `${
                      productData.currency === "USD" // essentially just ignore other currencies for now
                        ? "$"
                        : productData.currency
                    } ${productData.price}`
                  : "No price found"}
              </p>
              <p className="text-gray-400 text-xs">
                {productData.availability || "Availability unknown"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {isConfirming ? "Adding..." : "Confirm"}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
