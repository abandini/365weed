/**
 * Rate Limiter Durable Object
 * Provides distributed rate limiting across Workers
 */
export class RateLimiter {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const window = parseInt(url.searchParams.get('window') || '60', 10);

    if (!key) {
      return new Response('Missing key parameter', { status: 400 });
    }

    // Get current count
    const count = (await this.state.storage.get<number>(key)) || 0;

    if (count >= limit) {
      return new Response(
        JSON.stringify({ allowed: false, count, limit }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Increment count
    const newCount = count + 1;
    await this.state.storage.put(key, newCount);

    // Set alarm to reset count
    if (count === 0) {
      const resetTime = Date.now() + window * 1000;
      await this.state.storage.setAlarm(resetTime);
    }

    return new Response(
      JSON.stringify({ allowed: true, count: newCount, limit }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  async alarm(): Promise<void> {
    // Reset all rate limit counters
    await this.state.storage.deleteAll();
  }
}
