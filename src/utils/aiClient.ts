/**
 * Client-side AI utility calling server-side Gemini API endpoints.
 * All API key handling and Gemini SDK executions are secured on the Express server.
 */

export interface SuggestedDateIdea {
  title: string;
  description: string;
  tags: string[];
}

export interface SoloDateIdea {
  title: string;
  description: string;
}

export interface DiscoverItem {
  title: string;
  summary: string;
  category: string;
  estimatedBudget: number;
  imageSearchTerm?: string;
  sourceName?: string;
  isAiGenerated?: boolean;
}

export async function suggestDateIdea(
  goals: Array<{ name: string; targetAmount: number }>,
  events: Array<{ title: string; tags?: string[] }>
): Promise<SuggestedDateIdea> {
  const res = await fetch('/api/ai/suggest-date', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goals, events })
  });
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }
  return res.json();
}

export async function getSoloEncouragement(): Promise<string> {
  const res = await fetch('/api/ai/solo-advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }
  const data = await res.json();
  return data.text || "Focus on your growth; the best is yet to come.";
}

export async function getSoloDateIdea(): Promise<SoloDateIdea> {
  const res = await fetch('/api/ai/solo-date-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }
  return res.json();
}

export async function fetchDiscoverSuggestions(
  goals: Array<{ name: string }>
): Promise<string[]> {
  const res = await fetch('/api/ai/discover-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goals })
  });
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }
  const data = await res.json();
  return data.suggestions || [];
}

export async function discoverDateIdeas(params: {
  query?: string;
  goals?: Array<{ name: string }>;
  events?: Array<{ title: string }>;
  location?: { lat: number; lng: number } | null;
}): Promise<DiscoverItem[]> {
  const res = await fetch('/api/ai/discover-ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }
  const data = await res.json();
  return data.items || [];
}

/**
 * Server-Sent Events (SSE) streaming helper for real-time text streaming
 */
export async function streamText(
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void
): Promise<void> {
  const res = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  if (!res.ok || !res.body) {
    throw new Error(`Stream connection failed with ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') {
        onComplete?.();
        return;
      }
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.text) {
          onChunk(parsed.text);
        }
      } catch {
        // Raw text line
        if (dataStr) onChunk(dataStr);
      }
    }
  }

  onComplete?.();
}
