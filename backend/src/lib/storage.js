import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from '../config.js'
import fs from 'fs/promises'
import path from 'path'

function getS3Client() {
  const opts = {
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId || 'test',
      secretAccessKey: config.s3.secretAccessKey || 'test',
    },
  }
  if (config.s3.endpoint) {
    opts.endpoint = config.s3.endpoint
    opts.forcePathStyle = true
  }
  return new S3Client(opts)
}

let s3 = null

function getClient() {
  if (!s3) s3 = getS3Client()
  return s3
}

export async function uploadFile(localPath, key, contentType) {
  const buffer = await fs.readFile(localPath)
  await getClient().send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return key
}

export async function deleteFile(key) {
  await getClient().send(new DeleteObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  }))
}

export async function getSignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: config.s3.bucket, Key: key })
  return getSignedUrl(getClient(), command, { expiresIn })
}

export function buildS3Key(userId, fileName) {
  return `uploads/${userId}/${Date.now()}-${path.basename(fileName)}`
}
