import { createHmac, timingSafeEqual } from 'crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const SIGNATURE_HEADER = 'x-webhook-signature';

@Injectable()
export class HmacWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers[SIGNATURE_HEADER] as string | undefined;

    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const secret = this.configService.get<string>('WEBHOOK_SECRET', '');
    const body = JSON.stringify(request.body);
    const computed = createHmac('sha256', secret).update(body).digest('hex');

    if (signature.length !== computed.length) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
