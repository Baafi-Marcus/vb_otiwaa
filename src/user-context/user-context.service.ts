import { Injectable, Logger } from '@nestjs/common';
import { RedisProvider } from 'src/redis/redis.provider';
import * as crypto from 'crypto';

@Injectable()
export class UserContextService {
  private readonly logger: Logger = new Logger(UserContextService.name);
  private readonly salt = process.env.HASHING_SALT;
  private readonly contextExpirationTime = 10800; // Expiration Time In Seconds

  private readonly memoryStorage = new Map<string, string[]>();

  constructor(private readonly redisProvider: RedisProvider) { }

  private get redis() {
    return this.redisProvider.getClient();
  }

  // Phone Numbers shouldn't be said as plain text values
  // in the DB
  hashPhoneNumber(phoneNumber: string) {
    return crypto
      .createHmac('sha256', this.salt)
      .update(phoneNumber)
      .digest('hex');
  }

  async saveToContext(
    context: string,
    contextType: 'user' | 'assistant',
    userID: string,
  ) {
    const value = JSON.stringify({
      role: contextType,
      content: context,
    });
    const hashedUserID = this.hashPhoneNumber(userID);

    if (this.redis) {
      try {
        await this.redis.rPush(hashedUserID, value);
        await this.redis.expire(hashedUserID, this.contextExpirationTime);
        return 'Context Saved!';
      } catch (error) {
        this.logger.error('Error Saving Context to Redis', error);
      }
    }

    // Fallback or Primary Memory Storage
    if (!this.memoryStorage.has(hashedUserID)) {
      this.memoryStorage.set(hashedUserID, []);
    }
    this.memoryStorage.get(hashedUserID).push(value);
    return 'Context Saved (Memory)!';
  }

  async saveAndFetchContext(
    context: string,
    contextType: 'user' | 'assistant',
    userID: string,
  ) {
    const value = JSON.stringify({
      role: contextType,
      content: context,
    });
    const hashedUserID = this.hashPhoneNumber(userID);

    if (this.redis) {
      try {
        const results = await this.redis
          .multi()
          .rPush(hashedUserID, value) // Adding to user context
          .lRange(hashedUserID, -10, -1) // Fetch ONLY the last 10 messages to save tokens
          .expire(hashedUserID, this.contextExpirationTime)
          .exec(); // We're executing both operations in a single round-trip

        const lRangeResult = results[1];
        if (Array.isArray(lRangeResult)) {
          const conversationContext = lRangeResult as string[];
          return conversationContext.map((item) => JSON.parse(item));
        }
      } catch (error) {
        this.logger.error('Error Saving Context And Retrieving from Redis', error);
      }
    }

    // Fallback or Primary Memory Storage
    if (!this.memoryStorage.has(hashedUserID)) {
      this.memoryStorage.set(hashedUserID, []);
    }
    const history = this.memoryStorage.get(hashedUserID);
    history.push(value);

    // Slice last 10 items
    const relevantHistory = history.slice(-10);
    return relevantHistory.map((item) => JSON.parse(item));
  }

  async getConversationHistory(userID: string) {
    const hashedUserID = this.hashPhoneNumber(userID);

    if (this.redis) {
      try {
        const conversation = await this.redis.lRange(hashedUserID, 0, -1);
        await this.redis.expire(hashedUserID, this.contextExpirationTime);
        return conversation.map((item) => JSON.parse(item));
      } catch (error) {
        this.logger.error('Error fetching history from Redis', error);
      }
    }

    const history = this.memoryStorage.get(hashedUserID) || [];
    return history.map((item) => JSON.parse(item));
  }

  async clearContext(userID: string) {
    const hashedUserID = this.hashPhoneNumber(userID);
    if (this.redis) {
      try {
        await this.redis.del(hashedUserID);
      } catch (error) {
        this.logger.error('Error clearing context from Redis', error);
      }
    }
    this.memoryStorage.delete(hashedUserID);
    return 'Context Cleared!';
  }
}
