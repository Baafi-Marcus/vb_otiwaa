import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisProvider implements OnModuleInit {
  private readonly logger = new Logger(RedisProvider.name);
  private readonly redisClient: RedisClientType | null = null;

  constructor() {
    this.logger.warn('RedisProvider initialized in DISABLED mode.');
  }

  async onModuleInit() {
    this.logger.warn('Redis connection skipped. Using in-memory fallback.');
  }

  getClient(): RedisClientType | null {
    return null;
  }
}
