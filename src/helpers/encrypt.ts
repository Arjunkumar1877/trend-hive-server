import * as crypto from 'crypto';
import * as sharp from 'sharp';

const imageResizeSelection = (type: string) => {
  switch (type) {
    case 'banner':
      return {
        resized: { width: 1120, height: 260 },
        thumbnail: { width: 720, height: 170 },
      };
    default:
      return {
        resized: { width: 600, height: 600 },
        thumbnail: { width: 200, height: 200 },
      };
  }
};

export const resizedPhotoFromSharp = async (
  originalImageBuffer: Buffer,
  type: string,
) => {
  const { thumbnail, resized } = imageResizeSelection(type);

  const [thumbnailBuffer, resizedBuffer] = await Promise.all([
    sharp(originalImageBuffer)
      .resize(thumbnail.width, thumbnail.height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({
        quality: 90,
      })
      .toBuffer(),
    sharp(originalImageBuffer)
      .resize(resized.width, resized.height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({
        quality: 90,
      })
      .toBuffer(),
  ]);

  return { thumbnailBuffer, resizedBuffer };
};

export async function createToken({
  payload,
}: {
  payload: Record<string, string | number>;
}): Promise<string> {
  try {
    const algorithm = process.env.ENCRYPTION_ALGORITHM as string;
    const key = Buffer.from(process.env.ENCRYPTION_KEY as string, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encryptedToken = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encryptedToken += cipher.final('hex');

    return iv.toString('hex') + encryptedToken;
  } catch (error) {
    throw error;
  }
}

export const normalizeSpecialCharacters = (input: string): string => {
  if (!input) return input;

  const decomposed = input.normalize('NFD');

  const normalized = decomposed.replace(/[\u0300-\u036f]/g, '');

  return normalized
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'AE')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/ß/g, 'ss');
};

export async function decryptToken(input: {
  encryptedTokenWithIv: string;
}): Promise<string> {
  const { encryptedTokenWithIv } = input;
  const key = Buffer.from(
    this.configService.get('ENCRYPTION_KEY') as string,
    'hex',
  );

  const iv = Buffer.from(encryptedTokenWithIv.slice(0, 32), 'hex');
  const encryptedToken = encryptedTokenWithIv.slice(32);
  const encryptionAlgorithm = this.configService.getOrThrow(
    'ENCRYPTION_ALGORITHM',
  );

  const decipher = crypto.createDecipheriv(encryptionAlgorithm, key, iv);

  let decryptedToken = decipher.update(encryptedToken, 'hex', 'utf8');
  decryptedToken += decipher.final('utf8');

  return decryptedToken;
}

export async function getIdFromToken(input: {
  token: string;
}): Promise<string> {
  const { token } = input;
  try {
    const payload = JSON.parse(
      await this.decryptToken({ encryptedTokenWithIv: token }),
    ) satisfies {
      firebaseId: string;
      id: string;
    };
    return payload.id;
  } catch (error) {
    throw new Error('Error decrypting the token.');
  }
}
