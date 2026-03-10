import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EncryptionService } from './encryption.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, EncryptionService],
  exports: [EmailService, EncryptionService],
})
export class HelpersModule {}
