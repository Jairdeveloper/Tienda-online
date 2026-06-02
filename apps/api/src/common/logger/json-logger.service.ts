import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

type LogPayload = {
  level: LogLevel | 'fatal';
  timestamp: string;
  message: unknown;
  context?: string;
  trace?: string;
};

@Injectable()
export class JsonLoggerService extends ConsoleLogger {
  private print(level: LogPayload['level'], message: unknown, context?: string, trace?: string): void {
    const payload: LogPayload = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context,
      trace,
    };

    // Keep one-line JSON logs for easy parsing in CI/CD and log aggregators.
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }

  override log(message: unknown, context?: string): void {
    this.print('log', message, context);
  }

  override error(message: unknown, trace?: string, context?: string): void {
    this.print('error', message, context, trace);
  }

  override warn(message: unknown, context?: string): void {
    this.print('warn', message, context);
  }

  override debug(message: unknown, context?: string): void {
    this.print('debug', message, context);
  }

  override verbose(message: unknown, context?: string): void {
    this.print('verbose', message, context);
  }
}
