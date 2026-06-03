import { Test, type TestingModule } from '@nestjs/testing';
import { RedisLockService } from './redis-lock.service';
import { REDIS_CLIENT } from './redis.constants';
import type { RedisClient } from './redis.constants';

describe('RedisLockService', () => {
  let service: RedisLockService;
  let mockClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ping: jest.fn(),
      scan: jest.fn(),
      eval: jest.fn(),
      quit: jest.fn(),
    } as unknown as Record<string, jest.Mock>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisLockService,
        { provide: REDIS_CLIENT, useValue: mockClient as unknown as RedisClient },
      ],
    }).compile();

    service = module.get<RedisLockService>(RedisLockService);
  });

  describe('acquire', () => {
    it('should acquire lock successfully', async () => {
      mockClient.set.mockResolvedValue('OK');
      const result = await service.acquire('resource-1', 'id-1', 30);
      expect(result).toBe(true);
      expect(mockClient.set).toHaveBeenCalledWith(
        'lock:resource-1',
        'id-1',
        'EX',
        30,
        'NX',
      );
    });

    it('should return false when lock is already held', async () => {
      mockClient.set.mockResolvedValue(null);
      const result = await service.acquire('resource-1', 'id-2', 10);
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockClient.set.mockRejectedValue(new Error('redis error'));
      const result = await service.acquire('resource-1', 'id-1');
      expect(result).toBe(false);
    });

    it('should use default TTL when not specified', async () => {
      mockClient.set.mockResolvedValue('OK');
      await service.acquire('resource-1', 'id-1');
      expect(mockClient.set).toHaveBeenCalledWith(
        'lock:resource-1',
        'id-1',
        'EX',
        10,
        'NX',
      );
    });
  });

  describe('release', () => {
    it('should release lock when identifier matches', async () => {
      mockClient.get.mockResolvedValue('my-id');
      mockClient.del.mockResolvedValue(1);
      const result = await service.release('resource-1', 'my-id');
      expect(result).toBe(true);
      expect(mockClient.del).toHaveBeenCalledWith('lock:resource-1');
    });

    it('should not release lock when identifier does not match', async () => {
      mockClient.get.mockResolvedValue('other-id');
      const result = await service.release('resource-1', 'my-id');
      expect(result).toBe(false);
      expect(mockClient.del).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockClient.get.mockRejectedValue(new Error('redis error'));
      const result = await service.release('resource-1', 'my-id');
      expect(result).toBe(false);
    });
  });

  describe('isLocked', () => {
    it('should return true when lock exists', async () => {
      mockClient.exists.mockResolvedValue(1);
      const result = await service.isLocked('resource-1');
      expect(result).toBe(true);
    });

    it('should return false when lock does not exist', async () => {
      mockClient.exists.mockResolvedValue(0);
      const result = await service.isLocked('resource-1');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockClient.exists.mockRejectedValue(new Error('error'));
      const result = await service.isLocked('resource-1');
      expect(result).toBe(false);
    });
  });
});
