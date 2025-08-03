import { rewriteTitle, rewriteTitles } from "./title-rewriter";

// thank llm for this

async function testTitleRewriter() {
  console.log("Testing title rewriter...");

  const testTitle =
    "Premium Wireless Bluetooth Noise Cancelling Headphones with Built-in Microphone, 30-Hour Battery Life, Comfortable Over-Ear Design, Black";

  console.log("Original title:", testTitle);

  const rewritten = await rewriteTitle(testTitle);
  console.log("Rewritten title:", rewritten);

  const testItems = [
    {
      title:
        "Samsung Galaxy S23 Ultra 5G Smartphone, 256GB, Phantom Black, Unlocked",
    },
    {
      title:
        "Apple MacBook Pro 14-inch Laptop, M2 Pro Chip, 16GB RAM, 512GB SSD, Space Gray",
    },
    {
      title:
        "Sony WH-1000XM4 Wireless Noise Cancelling Headphones, Black, 30-Hour Battery Life",
    },
  ];

  console.log("\nTesting batch rewriting...");
  await rewriteTitles(testItems);

  testItems.forEach((item, index) => {
    console.log(`Item ${index + 1}: ${item.title}`);
  });
}

if (require.main === module) {
  testTitleRewriter().catch(console.error);
}
