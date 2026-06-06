import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUniqueOrThrow: jest.fn(),
    },
    session: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: number) => {
      if (key === 'JWT_ACCESS_TTL') return 900;
      if (key === 'JWT_REFRESH_TTL') return 604800;
      return defaultValue;
    }),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto = { email: 'test@test.com', password: 'Test123!', name: 'Test' };

    it('should register a new user and return auth response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUniqueOrThrow.mockResolvedValue({ id: 'role-id', name: 'customer' });
      mockPrisma.user.create.mockResolvedValue({ id: 'user-id' });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test',
        roles: [{ role: { name: 'customer', permissions: [{ permission: { key: 'products:read' } }] } }],
      });
      mockPrisma.session.create.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result.user.email).toBe('test@test.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@test.com', name: 'Test' }),
        }),
      );
    });

    it('should throw ConflictException when email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'test@test.com' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@test.com', password: 'Test123!' };

    it('should login and return auth response', async () => {
      const mockHashBuffer = Buffer.from('mock-hash');
      const hexHash = mockHashBuffer.toString('hex');
      const passwordHash = `salt:${hexHash}`;
      const cryptoSpy = jest.spyOn(require('crypto'), 'pbkdf2Sync').mockReturnValue(mockHashBuffer);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test',
        passwordHash,
        roles: [{ role: { name: 'customer', permissions: [{ permission: { key: 'products:read' } }] } }],
      });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test',
        roles: [{ role: { name: 'customer', permissions: [{ permission: { key: 'products:read' } }] } }],
      });
      mockPrisma.session.create.mockResolvedValue({});

      const result = await service.login(dto);

      expect(result.user.email).toBe('test@test.com');
      cryptoSpy.mockRestore();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        passwordHash: 'salt:different-hash',
        name: 'Test',
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete sessions by refresh token hash', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('refresh-token');

      expect(mockPrisma.session.deleteMany).toHaveBeenCalled();
    });
  });
});
