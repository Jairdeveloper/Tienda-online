import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockContext = (roles?: string[]) => {
    const handler = () => {};
    const cls = class {};
    if (roles) {
      Reflect.defineMetadata('roles', roles, handler);
    }
    return {
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', email: 'test@test.com', roles: ['customer'], permissions: [] },
        }),
      }),
    } as any;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    const context = mockContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const context = mockContext(['customer']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    const context = mockContext(['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when no user is present', () => {
    const handler = () => {};
    Reflect.defineMetadata('roles', ['admin'], handler);
    const context = {
      getHandler: () => handler,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(false);
  });
});
