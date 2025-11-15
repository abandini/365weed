/**
 * Perplexity API Integration for Cannabis News Fetching
 */

interface PerplexityMessage {
  role: 'system' | 'user';
  content: string;
}

interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
  return_citations?: boolean;
  return_images?: boolean;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  citations?: string[];
  images?: string[];
}

export interface NewsArticle {
  title: string;
  summary: string;
  content: string;
  category: 'legal' | 'medical' | 'business' | 'culture' | 'products';
  sourceUrls: string[];
  imageUrl?: string;
  tags: string[];
  publishedAt: string;
}

export class PerplexityNewsService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch today's cannabis news from Perplexity
   */
  async fetchDailyNews(): Promise<NewsArticle[]> {
    console.log(`[Perplexity] Starting fetchDailyNews with API key: ${this.apiKey ? 'present' : 'MISSING'}`);

    const categories = [
      {
        slug: 'legal',
        query: 'Latest cannabis legalization news, marijuana policy updates, and regulatory changes in the United States today',
      },
      {
        slug: 'medical',
        query: 'Recent cannabis medical research, health studies, and scientific discoveries about marijuana today',
      },
      {
        slug: 'business',
        query: 'Cannabis industry news, marijuana business updates, market trends, and company announcements today',
      },
      {
        slug: 'culture',
        query: 'Cannabis culture news, marijuana lifestyle trends, and social acceptance stories today',
      },
      {
        slug: 'products',
        query: 'New cannabis products, marijuana cultivation innovations, and technology advances today',
      },
    ];

    const articles: NewsArticle[] = [];

    for (const category of categories) {
      try {
        const article = await this.fetchCategoryNews(category.slug as any, category.query);
        if (article) {
          articles.push(article);
        }

        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error fetching ${category.slug} news:`, error);
      }
    }

    return articles;
  }

  /**
   * Fetch news for a specific category
   */
  private async fetchCategoryNews(
    category: NewsArticle['category'],
    query: string
  ): Promise<NewsArticle | null> {
    const systemPrompt = `You are a cannabis news journalist. Create a comprehensive, factual news article based on the latest information.

Format your response as JSON with this structure:
{
  "title": "Compelling headline (60-80 characters)",
  "summary": "2-3 sentence summary for previews",
  "content": "Full article content (500-800 words) in markdown format with proper headings and bullet points",
  "tags": ["tag1", "tag2", "tag3"],
  "publishedAt": "ISO timestamp of when this news occurred"
}

Guidelines:
- Use factual, journalistic tone
- Include specific details, dates, and names
- Use markdown formatting (headings, lists, bold)
- Make it engaging and informative
- Focus on recent events (today or this week)
- Include 3-5 relevant tags`;

    const request: PerplexityRequest = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      return_citations: true,
      return_images: true,
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Perplexity API error ${response.status}:`, errorText);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in Perplexity response');
      }

      // Extract JSON from markdown code blocks if present
      let jsonContent = content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonContent);

      // Ensure all fields are proper types
      const ensureString = (val: any): string => {
        if (typeof val === 'string') return val;
        if (val === null || val === undefined) return '';
        return String(val);
      };

      const ensureArray = (val: any): string[] => {
        if (Array.isArray(val)) return val.map(String);
        if (typeof val === 'string') return [val];
        return [];
      };

      return {
        title: ensureString(parsed.title),
        summary: ensureString(parsed.summary),
        content: ensureString(parsed.content),
        category,
        sourceUrls: data.citations || [],
        imageUrl: data.images?.[0],
        tags: ensureArray(parsed.tags),
        publishedAt: ensureString(parsed.publishedAt) || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Perplexity API error:', error);
      return null;
    }
  }

  /**
   * Fetch a single custom news query
   */
  async fetchCustomNews(query: string, category: NewsArticle['category']): Promise<NewsArticle | null> {
    return this.fetchCategoryNews(category, query);
  }
}

/**
 * Generate a URL-friendly slug from title
 */
export function generateSlug(title: string, date: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const dateSlug = date.split('T')[0];
  return `${dateSlug}-${slug}`;
}

/**
 * Extract plain text from markdown content
 */
export function extractPlainText(markdown: string, maxLength = 200): string {
  const plain = markdown
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).trim() + '...';
}
