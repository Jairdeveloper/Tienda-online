import { randomBytes, randomUUID, pbkdf2Sync } from 'crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { RegisterUserDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import type { AuthResponseDto, AuthUserDto } from './auth.types';
import type { AuthenticatedUser } from './decorators/current-user.decorator';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return hash === computed;
}

function hashToken(token: string): string {
  return pbkdf2Sync(token, 'refresh', 1, 32, 'sha256').toString('hex');
}

function extractRoles(user: {
  roles: Array<{
    role: { name: string; permissions: Array<{ permission: { key: string } }> };
  }>;
}): { roles: string[]; permissions: string[] } {
  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = [
    ...new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))),
  ];
  return { roles, permissions };
}

const userInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} as const;

@Injectable()
export class AuthService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTtl = this.configService.get<number>('JWT_ACCESS_TTL', 900);
    this.refreshTtl = this.configService.get<number>('JWT_REFRESH_TTL', 604800);
  }

  async register(dto: RegisterUserDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const customerRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: 'customer' },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        passwordHash: hashPassword(dto.password),
        roles: {
          create: { roleId: customerRole.id },
        },
      },
    });

    return this.generateAuthResponse(user.id);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: userInclude,
    });

    if (!user?.passwordHash || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateAuthResponse(user.id);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshHash = hashToken(dto.refreshToken);
    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: refreshHash,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        user: { include: userInclude },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.session.delete({ where: { id: session.id } });

    return this.generateAuthResponse(session.user.id);
  }

  async logout(refreshToken: string): Promise<void> {
    const refreshHash = hashToken(refreshToken);
    await this.prisma.session.deleteMany({
      where: { refreshTokenHash: refreshHash },
    });
  }

  async me(user: AuthenticatedUser): Promise<AuthUserDto> {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: userInclude,
    });

    const { roles, permissions } = extractRoles(dbUser as any);
    return {
      id: dbUser.id,
      email: dbUser.email ?? '',
      name: dbUser.name ?? undefined,
      roles,
      permissions,
    };
  }

  private async generateAuthResponse(userId: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: userInclude,
    });

    const { roles, permissions } = extractRoles(user as any);

    const now = Math.floor(Date.now() / 1000);
    const payload = { sub: user.id, email: user.email, roles, permissions };
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.accessTtl });

    const refreshToken = randomUUID();
    const refreshHash = hashToken(refreshToken);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: randomUUID(),
        refreshTokenHash: refreshHash,
        expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email ?? '',
        name: user.name ?? undefined,
        roles,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: now + this.accessTtl,
      },
    };
  }
}
