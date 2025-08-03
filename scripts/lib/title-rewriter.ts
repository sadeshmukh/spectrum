interface TitleRewriteRequest {
  titles: string[];
}

interface TitleRewriteResponse {
  rewritten_titles: string[];
}

export async function rewriteTitles(
  items: Array<{ title?: string }>
): Promise<void> {
  const apiUrl = process.env.PUBLIC_AI_API_URL;

  if (!apiUrl) {
    console.log("PUBLIC_AI_API_URL not found, skipping title rewriting");
    return;
  }

  console.log("Rewriting titles with AI...");

  const titles = items.filter((item) => item.title).map((item) => item.title!);

  if (titles.length === 0) {
    console.log("No titles to rewrite");
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that shortens product titles while preserving all key attributes like brand, color, size, material, and important features. Keep titles concise but informative. You must respond with ONLY a valid JSON object containing an array of rewritten titles. No other text, no thinking process, no explanations.",
          },
          {
            role: "user",
            content: `Shorten these product titles while keeping all important details. Return ONLY a JSON object like {"rewritten_titles": ["title1", "title2", ...]}: ${JSON.stringify(
              titles
            )}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(
        `Failed to rewrite titles: ${response.status} ${response.statusText}`
      );
      return;
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim();

    if (!responseText) {
      console.warn("No response received from API");
      return;
    }

    let jsonStart = responseText.indexOf("{");
    if (jsonStart === -1) {
      console.warn("No JSON object found in response");
      return;
    }

    const jsonText = responseText.substring(jsonStart);
    const result = JSON.parse(jsonText) as TitleRewriteResponse;

    if (!result.rewritten_titles || !Array.isArray(result.rewritten_titles)) {
      console.warn("Invalid response format - expected rewritten_titles array");
      return;
    }

    if (result.rewritten_titles.length !== titles.length) {
      console.warn(
        `Mismatch in title count: expected ${titles.length}, got ${result.rewritten_titles.length}`
      );
      return;
    }

    let titleIndex = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.title) {
        item.title = result.rewritten_titles[titleIndex];
        titleIndex++;
      }
    }

    console.log(
      `Successfully rewritten ${result.rewritten_titles.length} titles`
    );
  } catch (error) {
    console.warn(`Error rewriting titles: ${error}`);
  }
}
