import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseStorageService {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private storage;

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
  ) {
    // Get the Firebase Storage instance
    this.storage = getStorage(this.firebaseService.getFirebaseApp());
  }

  /**
   * Upload a file to Firebase Storage and return the download URL
   * @param file - The file to upload
   * @param path - The path in Firebase Storage where the file should be stored
   * @returns Promise<string> - The download URL of the uploaded file
   */
  async uploadFile(file: any, path: string): Promise<string> {
    try {
      // Generate a unique file name
      const fileName = `${uuidv4()}_${file.originalname}`;
      const fullPath = `${path}/${fileName}`;
      
      // Create a reference to the file location
      const storageRef = ref(this.storage, fullPath);
      
      // Create metadata with content type to ensure Firebase rules validation
      const metadata = {
        contentType: file.mimetype,
      };
      
      // Upload the file with metadata
      await uploadBytes(storageRef, file.buffer, metadata);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      this.logger.log(`File uploaded successfully: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Firebase Storage and return their download URLs
   * @param files - Array of files to upload
   * @param path - The path in Firebase Storage where the files should be stored
   * @returns Promise<string[]> - Array of download URLs for the uploaded files
   */
  async uploadMultipleFiles(files: any[], path: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, path));
      const downloadURLs = await Promise.all(uploadPromises);
      
      this.logger.log(`Uploaded ${files.length} files successfully`);
      return downloadURLs;
    } catch (error) {
      this.logger.error(`Error uploading multiple files: ${error.message}`);
      throw new Error(`Failed to upload multiple files: ${error.message}`);
    }
  }
} 