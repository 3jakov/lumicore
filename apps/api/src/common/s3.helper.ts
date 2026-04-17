import { randomUUID } from 'crypto';

export function generateS3Key(prefix: string, originalFilename: string): string {
  const ext = originalFilename.split('.').pop() ?? 'bin';
  return `${prefix}/${randomUUID()}.${ext}`;
}

export function buildPresignedUploadUrl(s3Key: string): string {
  // TODO(E7): replace with real AWS S3 presigned PUT URL
  return `https://placeholder-s3.example.com/${s3Key}`;
}

export function buildSignedReadUrl(s3Key: string | null): string | null {
  if (!s3Key) return null;
  // TODO(E7): replace with real AWS S3 signed GET URL
  return `https://placeholder-s3.example.com/${s3Key}`;
}
