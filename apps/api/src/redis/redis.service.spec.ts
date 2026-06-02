import { Test, type TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

describe('RedisService', () => {
  let service: RedisService;
  let mockClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      quit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: REDIS_CLIENT, useValue: mockClient },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  describe('get', () => {
    it('should return value when key exists', async () => {
      mockClient.get.mockResolvedValue('cached-value');
      const result = await service.get('my-key');
      expect(result).toBe('cached-value');
      expect(mockClient.get).toHaveBeenCalledWith('my-key');
    });

    it('should return null when key does not exist', async () => {
      mockClient.get.mockResolvedValue(null);
      const result = await service.get('missing-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value without TTL', async () => {
      mockClient.set.mockResolvedValue('OK');
      await service.set('my-key', 'my-value');
      expect(mockClient.set).toHaveBeenCalledWith('my-key', 'my-value');
    });

    it('should store value with TTL', async () => {
      mockClient.set.mockResolvedValue('OK');
      await service.set('my-key', 'my-value', 120);
      expect(mockClient.set).toHaveBeenCalledWith('my-key', 'my-value', 'EX', 120);
    });
  });

  describe('del', () => {
    it('should delete existing key', async () => {
      mockClient.del.mockResolvedValue(1);
      await service.del('my-key');
      expect(mockClient.del).toHaveBeenCalledWith('my-key');
    });

    it('should not throw on missing key', async () => {
      mockClient.del.mockResolvedValue(0);
      await expect(service.del('missing-key')).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockClient.exists.mockResolvedValue(1);
      const result = await service.exists('my-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockClient.exists.mockResolvedValue(0);
      const result = await service.exists('missing-key');
      expect(result).toBe(false);
    });
  });
});
