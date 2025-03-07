export interface IFirebaseUser {
    our_user_id: string;
    playerId: string;
    userId: string;
    roles: string[];
    last_name: string;
    first_name: string;
    iss: string;
    aud: string;
    auth_time: number;
    user_id: string;
    sub: string;
    iat: number;
    exp: number;
    email: string;
    email_verified: boolean;
    firebase: {
       identities: any;
       sign_in_provider: string;
       tenant: string;
    };
    uid: string;
 }
 
 export interface IFirebaseSignupUser {
    email: string;
    refreshToken: string;
    accessToken: string;
    uid: string;
    email_verified: boolean;
    first_name: string;
    last_name: string;
 }
 
 export interface IFirebaseTenantUser {
    email: string;
    uid: string;
 }
 
 export interface IFirebaseSignInUser {
    uid: string;
    email: string;
    token: string;
    tenantId: string;
 }