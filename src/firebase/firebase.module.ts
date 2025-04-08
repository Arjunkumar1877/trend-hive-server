import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { FirebaseStorageService } from './firebase-storage.service';

@Module({
  imports: [ConfigModule.forRoot()],  
  providers: [FirebaseService, FirebaseStorageService],       
  exports: [FirebaseService, FirebaseStorageService],        
})
export class FirebaseModule {}
