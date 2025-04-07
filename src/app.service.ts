import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { resizedPhotoFromSharp } from './helpers/utils';
@Injectable()
export class AppService {
   private storage: Storage;
   private bucketName: string;
   constructor(private readonly configService: ConfigService) {
      this.storage = new Storage();
      this.bucketName = this.configService.get<string>('FIREBASE_STORAGE_BUCKET') ?? '';
   }

   getHello(): string {
      return 'Hello World!';
   }

   generateURls(fileName: string) {
      return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
   }

   uploadFileOnBucket(fileName: string, buffer: any) {
      return this.storage.bucket(this.bucketName).file(fileName).save(buffer, { public: true });
   }

   async uploadFile(input: { file: any; type: string }) {
      try {
         const { file, type } = input;
         const uuid = uuidv4();

         const originalFileName = `profile/image/${uuid}_original.${file.mimetype.split('/')[1]}`;
         const thumbnailFileName = `profile/image/${uuid}_thumbnail.webp`;
         const resizedFileName = `profile/image/${uuid}_resized.webp`;

         const { thumbnailBuffer, resizedBuffer } = await resizedPhotoFromSharp(file.buffer, type);

         await Promise.all([
            this.uploadFileOnBucket(originalFileName, file.buffer),
            this.uploadFileOnBucket(thumbnailFileName, thumbnailBuffer),
            this.uploadFileOnBucket(resizedFileName, resizedBuffer)
         ]);

         return {
            originalImageURL: this.generateURls(originalFileName),
            thumbnailImageURL: this.generateURls(thumbnailFileName),
            resizedImageURL: this.generateURls(resizedFileName)
         };
      } catch (error) {
         throw new Error(error);
      }
   }

   async uploadFileAndGetOneUrl(input: { file: any; type: string }): Promise<string> {
      try {
         const { file } = input;
         const uuid = uuidv4();

         // Generate the file name for the original image
         const originalFileName = `review/image/${uuid}_original.${file.mimetype.split('/')[1]}`;

         // Upload the original file
         await this.uploadFileOnBucket(originalFileName, file.buffer);

         // Generate and return the URL for the uploaded file
         return this.generateURls(originalFileName);
      } catch (error) {
         console.error('Error uploading file:', error);
         throw new Error('Failed to upload the file and generate the URL.');
      }
   }
}