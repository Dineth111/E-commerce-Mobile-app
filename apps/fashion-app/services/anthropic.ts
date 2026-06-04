import type { StyleProfile, ChatMessage, Product, AIRecommendation } from '@/types';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const BASE_URL = 'https://api.anthropic.com/v1';
const MODEL = 'claude-sonnet-4-5';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
};

// ─── Personalized Recommendations ────────────────────────────────────────────
export async function getRecommendations(
  profile: StyleProfile,
  browsingHistory: string[],
  catalog: Product[]
): Promise<AIRecommendation[]> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    // Return mock recommendations when no API key
    return catalog.slice(0, 6).map((p, i) => ({
      productId: p.id,
      reason: [
        'Matches your minimalist aesthetic perfectly',
        'Aligns with your preferred color palette',
        'Trending in your size range',
        'Top pick based on your style quiz',
        'Similar to items you recently viewed',
        'Perfect for your stated occasions',
      ][i] ?? 'Curated just for you',
      matchScore: Math.round(90 - i * 5),
    }));
  }

  const catalogSummary = catalog.slice(0, 20).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    tags: p.tags,
  }));

  const prompt = `Given this user's style profile: ${JSON.stringify(profile)}, 
browsing history (product IDs): ${JSON.stringify(browsingHistory.slice(0, 10))}, 
suggest 6 fashion products from this catalog: ${JSON.stringify(catalogSummary)}.

Return ONLY a valid JSON array with objects: { productId, reason, matchScore }
where reason is a short, compelling 1-sentence explanation and matchScore is 0-100.
No extra text, only JSON.`;

  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  const text = data.content[0]?.text ?? '[]';

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    return [];
  }
}

// ─── Visual Search ─────────────────────────────────────────────────────────────
export async function visualSearch(base64Image: string): Promise<{
  items: Array<{ type: string; color: string; style: string; material: string }>;
}> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return {
      items: [
        { type: 'Blazer', color: 'Navy Blue', style: 'Smart Casual', material: 'Wool Blend' },
        { type: 'Trousers', color: 'Charcoal Grey', style: 'Tailored', material: 'Polyester' },
      ],
    };
  }

  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
            },
            {
              type: 'text',
              text: 'Identify the clothing items in this image. For each item describe: type, color, style, material estimate. Return ONLY a JSON object: { items: [{ type, color, style, material }] }',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  const text = data.content[0]?.text ?? '{}';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };
  } catch {
    return { items: [] };
  }
}

// ─── AI Stylist Chat (Streaming) ──────────────────────────────────────────────
export async function streamChatMessage(
  messages: ChatMessage[],
  profile: StyleProfile,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    // Simulate streaming with mock response
    const mockResponses = [
      "I love your style! Based on your preferences, I'd recommend pairing the Velvet Midnight Blazer with high-waisted wide-leg trousers for an instantly elevated look. 🖤\n\nThe key to making this work is the proportion game — structure on top with something fluid below creates beautiful contrast.",
      "Great question! For your body type and color palette, neutral tones with one statement piece work best. Try the Cashmere Oversized Crew in oatmeal with the Linen Wide-Leg Trousers — effortlessly chic for any occasion.",
      "That's a gorgeous combination! The silk wrap dress is incredibly versatile. Style it with strappy heels for evening, or layer a chunky knit over it and add white sneakers for a trendy daytime look. ✨",
    ];
    const mock = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const words = mock.split(' ');
    for (const word of words) {
      await new Promise((r) => setTimeout(r, 60));
      onChunk(word + ' ');
    }
    onDone();
    return;
  }

  const systemPrompt = `You are Aria, a world-class personal fashion stylist. You know this user's style profile intimately:
- Body type: ${profile.bodyType}
- Preferred styles: ${profile.preferredStyles.join(', ')}
- Color palette: ${profile.colorPalette}
- Budget: ${profile.budgetRange}
- Favorite brands: ${profile.favoriteBrands.join(', ')}

Suggest specific, actionable outfit advice. Be warm, enthusiastic, and fashion-forward. Keep responses concise but impactful. Use occasional emojis.`;

  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.imageUri
      ? [
          { type: 'image', source: { type: 'url', url: m.imageUri } },
          { type: 'text', text: m.content },
        ]
      : m.content,
  }));

  try {
    const response = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { ...headers, 'anthropic-beta': 'streaming' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              onChunk(event.delta.text);
            }
          } catch {}
        }
      }
    }
    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

// ─── Size Recommendation ───────────────────────────────────────────────────────
export async function getSizeRecommendation(
  measurements: { bust?: number; waist?: number; hips?: number; height?: number },
  sizeChart: Array<{ size: string; bust?: number; waist?: number; hips?: number }>
): Promise<{ recommendedSize: string; fitNotes: string }> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return {
      recommendedSize: 'M',
      fitNotes: 'Based on your measurements, a size M should fit comfortably with slight room to move. If between sizes, size up for a relaxed fit.',
    };
  }

  const prompt = `User measurements: ${JSON.stringify(measurements)} (in cm).
Product size chart: ${JSON.stringify(sizeChart)}.
Which size do you recommend and why? Return ONLY JSON: { recommendedSize: string, fitNotes: string }`;

  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) return { recommendedSize: 'M', fitNotes: 'Unable to calculate. Please check size guide.' };
  const data = await response.json();
  const text = data.content[0]?.text ?? '{}';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendedSize: 'M', fitNotes: '' };
  } catch {
    return { recommendedSize: 'M', fitNotes: '' };
  }
}

// ─── Outfit Suggestions ("Complete The Look") ─────────────────────────────────
export async function getOutfitSuggestions(
  product: { name: string; category: string; color: string; style: string },
  catalog: Array<{ id: string; name: string; category: string; tags: string[] }>
): Promise<Array<{ productId: string; role: string }>> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return catalog.slice(0, 3).map((p) => ({
      productId: p.id,
      role: 'Pairs beautifully together',
    }));
  }

  const prompt = `For this hero item: ${JSON.stringify(product)}, suggest 3 complementary items from this catalog to "Complete The Look":
${JSON.stringify(catalog.slice(0, 15))}.
Return ONLY JSON array: [{ productId, role }] where role is a brief styling note (e.g. "Adds sophisticated contrast").`;

  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) return [];
  const data = await response.json();
  const text = data.content[0]?.text ?? '[]';
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    return [];
  }
}
