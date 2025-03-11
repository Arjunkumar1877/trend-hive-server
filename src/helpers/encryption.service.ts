import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  constructor(@Inject(ConfigService) private configService: ConfigService) {}

  async decryptToken(input: { encryptedTokenWithIv: string }): Promise<string> {
    const { encryptedTokenWithIv } = input;
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    const encryptionAlgorithm = this.configService.get<string>('ENCRYPTION_ALGORITHM');

    if (!encryptionKey) {
      throw new Error('Encryption key is missing.');
    }
    if (!encryptionAlgorithm) {
      throw new Error('Encryption algorithm is missing.');
    }

    const key = Buffer.from(encryptionKey, 'hex');
    const iv = Buffer.from(encryptedTokenWithIv.slice(0, 32), 'hex');
    const encryptedToken = encryptedTokenWithIv.slice(32);

    try {
      const decipher = crypto.createDecipheriv(encryptionAlgorithm, key, iv);
      let decryptedToken = decipher.update(encryptedToken, 'hex', 'utf8');
      decryptedToken += decipher.final('utf8');

      return decryptedToken;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Invalid encryption data.');
    }
  }

  async getIdFromToken(input: { token: string }): Promise<string> {
    try {
      const decrypted = await this.decryptToken({ encryptedTokenWithIv: input.token });
      const payload = JSON.parse(decrypted) as { firebaseId: string; id: string };
      
      if (!payload.id) {
        throw new Error('User ID missing in decrypted token.');
      }

      return payload.id;
    } catch (error) {
      console.error('Token decryption failed:', error);
      throw new Error('Error decrypting the token.');
    }
  }
}
