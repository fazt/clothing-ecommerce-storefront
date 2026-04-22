import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export class StorageNotConfiguredError extends Error {
  code = "STORAGE_NOT_CONFIGURED" as const;
  constructor() {
    super("DigitalOcean Spaces credentials are not configured");
  }
}

function readEnv() {
  const endpoint = (process.env.DO_SPACES_ENDPOINT ?? "").trim();
  const region = (process.env.DO_SPACES_REGION ?? "").trim();
  const bucket = (process.env.DO_SPACES_BUCKET ?? "").trim();
  const accessKeyId = (process.env.DO_SPACES_KEY ?? "").trim();
  const secretAccessKey = (process.env.DO_SPACES_SECRET ?? "").trim();
  const cdnEndpoint = (process.env.DO_SPACES_CDN_ENDPOINT ?? "").trim();
  return { endpoint, region, bucket, accessKeyId, secretAccessKey, cdnEndpoint };
}

export function isConfigured(): boolean {
  const { endpoint, region, bucket, accessKeyId, secretAccessKey } = readEnv();
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    return false;
  }
  const any = [bucket, accessKeyId, secretAccessKey].some((v) =>
    v.includes("placeholder"),
  );
  return !any;
}

let cachedClient: S3Client | null = null;
function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const { endpoint, region, accessKeyId, secretAccessKey } = readEnv();
  cachedClient = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false,
  });
  return cachedClient;
}

function buildPublicUrl(key: string): string {
  const { endpoint, bucket, cdnEndpoint } = readEnv();
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  if (cdnEndpoint) {
    return `${cdnEndpoint.replace(/\/+$/, "")}/${encodedKey}`;
  }
  // Virtual-hosted style: https://<bucket>.<region>.digitaloceanspaces.com/<key>
  const withoutProtocol = endpoint
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  return `https://${bucket}.${withoutProtocol}/${encodedKey}`;
}

export interface PutObjectInput {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}

export interface PutObjectResult {
  key: string;
  publicUrl: string;
}

export async function putObject(
  input: PutObjectInput,
): Promise<PutObjectResult> {
  if (!isConfigured()) throw new StorageNotConfiguredError();
  const { bucket } = readEnv();
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      ACL: "public-read",
      CacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );
  return { key: input.key, publicUrl: buildPublicUrl(input.key) };
}
