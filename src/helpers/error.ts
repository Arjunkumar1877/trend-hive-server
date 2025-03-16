export function getFirebaseErrorMessage(error: { message: string; code: string; }) {
    console.log('Error object:', error);

    const errorMessage = error.message || error.code || 'An unknown error occurred. Please try again later.';

    if (errorMessage.includes('auth/email-already-in-use')) {
        return 'This email is already associated with an account. Please use a different email or log in.';
    } else if (errorMessage.includes('auth/invalid-email')) {
        return 'The email address is not valid. Please check the format.';
    } else if (errorMessage.includes('auth/weak-password')) {
        return 'Your password is too weak. Please use a stronger password.';
    } else if (errorMessage.includes('auth/user-not-found')) {
        return 'No user found with this email. Please sign up.';
    } else if (errorMessage.includes('auth/wrong-password')) {
        return 'The password is incorrect. Please try again.';
    } else if (errorMessage.includes('auth/operation-not-allowed')) {
        return 'This operation is not allowed. Please check your Firebase settings.';
    } else if (errorMessage.includes('auth/network-request-failed')) {
        return 'Network error. Please check your internet connection and try again.';
    } else if (errorMessage.includes('auth/too-many-requests')) {
        return 'Too many requests. Please try again later.';
    } else if (errorMessage.includes('auth/account-exists-with-different-credential')) {
        return 'An account already exists with the same email address, but with a different sign-in provider. Please use a different provider to log in.';
    } else {
        return `Error: ${errorMessage}. Please try again later.`;
    }
}



export function isFirebaseError(error: unknown): error is { message: string; code: string } {
    return (
      typeof (error as { message?: string; code?: string }).message === 'string' &&
      typeof (error as { message?: string; code?: string }).code === 'string'
    );
  }