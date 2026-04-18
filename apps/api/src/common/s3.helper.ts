import { randomUUID } from 'crypto';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 15;

let s3Client: S3Client | null = null;

export function generateS3Key(prefix: string, originalFilename: string): string {
  const extension = originalFilename.split('.').pop()?.trim().toLowerCase() || 'bin';
  return `${prefix}/${randomUUID()}.${extension}`;
}

export async function buildPresignedUploadUrl(s3Key: string): Promise<string> {
  const client = getS3Client();
  const bucket = getRequiredEnv('AWS_S3_BUCKET');

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    }),
    { expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS },
  );
}

export async function buildSignedReadUrl(
  s3Key: string | null,
): Promise<string | null> {
  if (!s3Key) {
    return null;
  }

  const client = getS3Client();
  const bucket = getRequiredEnv('AWS_S3_BUCKET');

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    }),
    { expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS },
  );
}

function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const region = getRequiredEnv('AWS_S3_REGION');
  const accessKeyId = getRequiredEnv('AWS_ACCESS_KEY_ID');
  const secretAccessKey = getRequiredEnv('AWS_SECRET_ACCESS_KEY');
  const endpoint = process.env.AWS_S3_ENDPOINT?.trim();

  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    ...(endpoint
      ? {
          endpoint,
          forcePathStyle: true,
        }
      : {}),
  });

  return s3Client;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required S3 configuration: ${name}`);
  }

  return value;
}
