import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { email: 'test@test.com', password: 'Test123!', name: 'Test' };
      mockAuthService.register.mockResolvedValue({ user: { email: 'test@test.com' }, tokens: {} });

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { email: 'test@test.com', password: 'Test123!' };
      mockAuthService.login.mockResolvedValue({ user: { email: 'test@test.com' }, tokens: {} });

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout({ refreshToken: 'token' });

      expect(authService.logout).toHaveBeenCalledWith('token');
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('me', () => {
    it('should call authService.me', async () => {
      const user = { id: 'user-id', email: 'test@test.com', roles: [], permissions: [] };
      mockAuthService.me.mockResolvedValue(user);

      const result = await controller.me(user);

      expect(authService.me).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });
  });

  describe('status', () => {
    it('should return ok', () => {
      const result = controller.status();
      expect(result).toEqual({ module: 'auth', status: 'ok' });
    });
  });
});
