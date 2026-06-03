import { UpstashClient } from './upstash-client';

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}));

describe('UpstashClient', () => {
  let client: UpstashClient;
  let mockInner: Record<string, jest.Mock>;

  beforeEach(() => {
    mockInner = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ping: jest.fn(),
      scan: jest.fn(),
    };
    const { Redis } = jest.requireMock('@upstash/redis');
    Redis.mockImplementation(() => mockInner);
    client = new UpstashClient('https://test.upstash.io', 'test-token');
  });

  describe('get', () => {
    it('should return value when key exists', async () => {
      mockInner.get.mockResolvedValue('cached-value');
      await expect(client.get('existing-key')).resolves.toBe('cached-value');
    });

    it('should return null when key does not exist', async () => {
      mockInner.get.mockResolvedValue(null);
      await expect(client.get('missing-key')).resolves.toBeNull();
    });

    it('should return null on error', async () => {
      mockInner.get.mockRejectedValue(new Error('connection error'));
      await expect(client.get('error-key')).resolves.toBeNull();
    });
  });

  describe('set', () => {
    it('should set value without options', async () => {
      mockInner.set.mockResolvedValue('OK');
      await expect(client.set('key', 'value')).resolves.toBe('OK');
    });

    it('should set value with EX and NX options', async () => {
      mockInner.set.mockResolvedValue('OK');
      await expect(
        client.set('lock-key', 'identifier', 'EX', 10, 'NX'),
      ).resolves.toBe('OK');
      expect(mockInner.set).toHaveBeenCalledWith('lock-key', 'identifier', {
        ex: 10,
        nx: true,
      });
    });

    it('should set value with EX only', async () => {
      mockInner.set.mockResolvedValue('OK');
      await expect(client.set('ttl-key', 'value', 'EX', 60)).resolves.toBe(
        'OK',
      );
      expect(mockInner.set).toHaveBeenCalledWith('ttl-key', 'value', {
        ex: 60,
      });
    });

    it('should handle errors gracefully', async () => {
      mockInner.set.mockRejectedValue(new Error('timeout'));
      await expect(
        client.set('error-key', 'value'),
      ).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete a single key', async () => {
      mockInner.del.mockResolvedValue(1);
      await expect(client.del('key')).resolves.toBe(1);
    });

    it('should delete multiple keys', async () => {
      mockInner.del.mockResolvedValue(1);
      await expect(client.del('key1', 'key2', 'key3')).resolves.toBe(3);
    });

    it('should return 0 for empty keys', async () => {
      await expect(client.del()).resolves.toBe(0);
    });

    it('should return 0 on error', async () => {
      mockInner.del.mockRejectedValue(new Error('error'));
      await expect(client.del('fail-key')).resolves.toBe(0);
    });
  });

  describe('exists', () => {
    it('should return 1 when key exists', async () => {
      mockInner.exists.mockResolvedValue(1);
      await expect(client.exists('key')).resolves.toBe(1);
    });

    it('should return 0 when key does not exist', async () => {
      mockInner.exists.mockResolvedValue(0);
      await expect(client.exists('missing')).resolves.toBe(0);
    });

    it('should return 0 on error', async () => {
      mockInner.exists.mockRejectedValue(new Error('error'));
      await expect(client.exists('error')).resolves.toBe(0);
    });
  });

  describe('ping', () => {
    it('should return PONG on success', async () => {
      mockInner.ping.mockResolvedValue('PONG');
      await expect(client.ping()).resolves.toBe('PONG');
    });

    it('should return ERROR on failure', async () => {
      mockInner.ping.mockRejectedValue(new Error('timeout'));
      await expect(client.ping()).resolves.toBe('ERROR');
    });
  });

  describe('scan', () => {
    it('should return cursor and keys', async () => {
      mockInner.scan.mockResolvedValue({ 0: '10', 1: ['key1', 'key2'] });
      const result = await client.scan('0');
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result[0]).toBe('string');
      expect(Array.isArray(result[1])).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockInner.scan.mockRejectedValue(new Error('scan error'));
      await expect(client.scan('0')).resolves.toEqual(['0', []]);
    });
  });

  describe('eval', () => {
    it('should throw not supported error', async () => {
      await expect(client.eval('script', 1)).rejects.toThrow(
        'EVAL is not supported by Upstash REST API',
      );
    });
  });

  describe('quit', () => {
    it('should not throw', async () => {
      await expect(client.quit()).resolves.toBeUndefined();
    });
  });
});
