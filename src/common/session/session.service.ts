import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { type AppConfig, CONFIG_NAME } from '../config';
import {
  Session,
  SessionState,
  UpdateSessionPayload,
} from 'src/models/dto/auth.dto';
import {
  decryptSessionPayload,
  encryptSessionPayload,
} from '../utils/encryptSession';

@Injectable()
export class SessionService implements OnModuleInit {
  private redis: Redis;
  constructor(@Inject(CONFIG_NAME) private readonly config: AppConfig) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.config.REDIS_HOST,
      port: this.config.REDIS_PORT,
      username: this.config.REDIS_USERNAME,
      password: this.config.REDIS_PASSWORD,
    });
  }

  async put(key: string, payload: Session, secret: Buffer, ttl: number) {
    key = `users:session:${key}`;
    await this.redis.setex(key, ttl, encryptSessionPayload(payload, secret));
  }

  async get(key: string, secret: Buffer): Promise<Session | null> {
    key = `users:session:${key}`;
    const sessionString = await this.redis.get(key);
    if (!sessionString) return null;

    try {
      const session = decryptSessionPayload(sessionString, secret);

      if (
        session.state == SessionState.BLOCKED ||
        session.state == SessionState.DEACTIVE
      )
        return null;

      return session;
    } catch (error) {
      return null;
    }
  }

  async del(key: string) {
    key = `users:session:${key}`;
    await this.redis.del(key);
  }

  async update(key: string, payload: UpdateSessionPayload, secret: Buffer) {
    key = `users:session:${key}`;
    const ttl = await this.redis.ttl(key);

    const sessionString = await this.redis.get(key);

    if (sessionString) {
      let session = decryptSessionPayload(sessionString, secret);
      session = {
        ...session,
        ...payload,
      };

      await this.redis.set(key, encryptSessionPayload(session, secret));

      if (ttl > 0) {
        await this.redis.expire(key, ttl);
      }
    }
  }
}
