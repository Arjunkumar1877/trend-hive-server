import { Module, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from 'dotenv';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_PIPE } from '@nestjs/core';
import { FirebaseModule } from './firebase/firebase.module';
import { AddressModule } from './address/address.module';
import { EncryptionService } from './helpers/encryption.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';

config();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/trend-hive',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    FirebaseModule,
    AddressModule,
    AdminModule,
    ProductsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    EncryptionService,
  ],
})
export class AppModule {}
