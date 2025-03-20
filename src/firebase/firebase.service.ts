import { Injectable, Logger } from '@nestjs/common';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  UserCredential,
} from 'firebase/auth';
import * as admin from 'firebase-admin';

import { ConfigService } from '@nestjs/config';
import { IFirebaseUser } from 'src/types/firebase.types';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: FirebaseApp;
  private auth: Auth;

  constructor(private configService: ConfigService) {
    this.firebaseApp = initializeApp({
      apiKey: this.configService.get<string>('FIREBASE_API_KEY'),
      authDomain: this.configService.get<string>('FIREBASE_AUTH_DOMAIN'),
      projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: this.configService.get<string>(
        'FIREBASE_MESSAGING_SENDER_ID',
      ),
      appId: this.configService.get<string>('FIREBASE_APP_ID'),
    });

    this.auth = getAuth(this.firebaseApp);
  }

  /**
   * Sign up a user in Firebase Authentication
   * @param email - User's email
   * @param password - User's password
   * @returns Promise<UserCredential>
   */
  async signup(email: string, password: string): Promise<UserCredential> {
    try {
      // Check if user already exists
      const signInMethods = await fetchSignInMethodsForEmail(this.auth, email);
      if (signInMethods.length > 0) {
        throw new Error('User already exists with this email');
      }

      // Create new user
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      this.logger.log(`User created: ${userCredential.user.email}`);
      return userCredential;
    } catch (error) {
      this.logger.error(`Signup failed: ${error.message}`);
      throw new Error(error.message);
    }
  }

  /**
   * Sign in a user using Firebase Authentication
   * @param email - User's email
   * @param password - User's password
   * @returns Promise<UserCredential>
   */
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      this.logger.log(`User logged in: ${userCredential.user.email}`);
      return userCredential;
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw new Error(error.message);
    }
  }

  async decodeToken(token: string): Promise<IFirebaseUser> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken as IFirebaseUser;
    } catch (error) {
      this.logger.error({ message: 'Error verifying Firebase token:', error });
      throw new Error(error);
    }
  }
}
