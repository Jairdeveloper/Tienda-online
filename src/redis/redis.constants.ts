export const REDIS_CLIENT = "REDIS_CLIENT" as const;

export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string | number, ...args: any[]): Promise<any>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  ping(): Promise<string>;
  scan(cursor: string | number, ...args: any[]): Promise<[string, string[]]>;
  eval(script: string, numKeys: number, ...args: any[]): Promise<any>;
  quit(): Promise<void>;
}

export type RedisClient = IRedisClient;
