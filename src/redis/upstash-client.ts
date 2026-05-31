import { Redis } from "@upstash/redis";

export class UpstashClient {
  private readonly client: Redis;

  constructor(url: string, token: string) {
    this.client = new Redis({ url, token });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string | number, ...args: any[]): Promise<any> {
    if (args.length === 0) {
      return this.client.set(key, value);
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

    return this.client.set(key, value, options);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    if (keys.length === 1) return this.client.del(keys[0]);
    let count = 0;
    for (const key of keys) {
      count += await this.client.del(key);
    }
    return count;
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async scan(
    _cursor: string | number,
    ..._args: any[]
  ): Promise<[string, string[]]> {
    return ["0", []];
  }

  async eval(_script: string, _numKeys: number, ..._args: any[]): Promise<any> {
    throw new Error("EVAL is not supported by Upstash REST API");
  }

  async quit(): Promise<void> {}
}
