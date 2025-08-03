interface TitleRewriteRequest {
  title: string;
}

interface TitleRewriteResponse {
  rewritten_title: string;
}

export async function rewriteTitle(title: string): Promise<string> {
  const apiKey = process.env.PUBLIC_AI_API_KEY;

  if (!apiKey) {
    return title;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that shortens product titles while preserving all key attributes like brand, color, size, material, and important features. Keep the title concise but informative. Return only the rewritten title, nothing else.",
          },
          {
            role: "user",
            content: `Shorten this product title while keeping all important details: "${title}"`,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.warn(
        `Failed to rewrite title: ${response.status} ${response.statusText}`
      );
      return title;
    }

    const data = await response.json();
    const rewrittenTitle = data.choices?.[0]?.message?.content?.trim();

    if (!rewrittenTitle) {
      console.warn("No rewritten title received from API");
      return title;
    }

    return rewrittenTitle;
  } catch (error) {
    console.warn(`Error rewriting title: ${error}`);
    return title;
  }
}

export async function rewriteTitles(
  items: Array<{ title?: string }>
): Promise<void> {
  const apiKey = process.env.PUBLIC_AI_API_KEY;

  if (!apiKey) {
    console.log("PUBLIC_AI_API_KEY not found, skipping title rewriting");
    return;
  }

  console.log("Rewriting titles with AI...");

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.title) {
      const originalTitle = item.title;
      item.title = await rewriteTitle(originalTitle);

      if (i % 10 === 0) {
        console.log(`Processed ${i + 1}/${items.length} titles`);
      }
    }
  }

  console.log("Title rewriting completed");
}
