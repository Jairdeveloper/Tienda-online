import { Redis } from "@upstash/redis";

export class UpstashClient {
  private readonly client: Redis;

  constructor(url: string, token: string) {
    this.client = new Redis({ url, token });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (e) {
      console.error(
        `Upstash GET error [${key}]:`,
        e instanceof Error ? e.message : e,
      );
      return null;
    }
  }

  async set(key: string, value: string | number, ...args: any[]): Promise<any> {
    try {
      if (args.length === 0) {
        return await this.client.set(key, value);
      }

      const exIdx = args.indexOf("EX");
      const nxIdx = args.indexOf("NX");

      const options: Record<string, any> = {};
      if (exIdx !== -1 && args[exIdx + 1]) {
        options.ex = args[exIdx + 1];
      }
      if (nxIdx !== -1) {
        options.nx = true;
      }

      return await this.client.set(key, value, options);
    } catch (e) {
      console.error(
        `Upstash SET error [${key}]:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  async del(...keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;
      if (keys.length === 1) return await this.client.del(keys[0]);
      let count = 0;
      for (const key of keys) {
        count += await this.client.del(key);
      }
      return count;
    } catch (e) {
      console.error(`Upstash DEL error:`, e instanceof Error ? e.message : e);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (e) {
      console.error(
        `Upstash EXISTS error [${key}]:`,
        e instanceof Error ? e.message : e,
      );
      return 0;
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (e) {
      console.error(`Upstash PING error:`, e instanceof Error ? e.message : e);
      return "ERROR";
    }
  }

  async scan(
    _cursor: string | number,
    ..._args: any[]
  ): Promise<[string, string[]]> {
    try {
      const result = await this.client.scan(_cursor, { count: 100 });
      return [result[0], result[1]];
    } catch (e) {
      console.error(`Upstash SCAN error:`, e instanceof Error ? e.message : e);
      return ["0", []];
    }
  }

  async eval(_script: string, _numKeys: number, ..._args: any[]): Promise<any> {
    throw new Error("EVAL is not supported by Upstash REST API");
  }

  async quit(): Promise<void> {}
}
