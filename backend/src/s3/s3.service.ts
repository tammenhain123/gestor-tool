import { Injectable, Logger } from '@nestjs/common'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'stream'

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  private client: S3Client
  private bucket = process.env.S3_BUCKET!

  constructor() {
    // Normalize endpoint: if provided without protocol, assume https://
    let endpointVar = process.env.S3_ENDPOINT ? String(process.env.S3_ENDPOINT).trim() : undefined
    if (endpointVar && !/^https?:\/\//i.test(endpointVar)) endpointVar = `https://${endpointVar}`

    this.logger.log(`S3 client config - bucket=${this.bucket} region=${process.env.S3_REGION} endpoint=${endpointVar ?? 'default'}`)

    // Validate and normalize credentials from env
    const rawAccessKey = typeof process.env.AWS_ACCESS_KEY_ID === 'string' ? process.env.AWS_ACCESS_KEY_ID.trim() : undefined
    const rawSecret = typeof process.env.AWS_SECRET_ACCESS_KEY === 'string' ? process.env.AWS_SECRET_ACCESS_KEY.trim() : undefined
    const rawSession = typeof process.env.AWS_SESSION_TOKEN === 'string' ? process.env.AWS_SESSION_TOKEN.trim() : undefined

    const credsProvided = !!(rawAccessKey && rawSecret)
    if (!credsProvided) this.logger.warn('AWS credentials not fully provided via env; falling back to default credential provider chain')

    const clientOpts: any = {
      region: process.env.S3_REGION,
      endpoint: endpointVar || undefined,
    }

    if (credsProvided) {
      // Basic sanity checks
      if (!rawAccessKey || rawAccessKey.length < 4 || !rawSecret || rawSecret.length < 8) {
        this.logger.error('AWS credentials appear invalid (too short) — do not use empty strings')
        throw new Error('Invalid AWS credentials provided via environment')
      }
      clientOpts.credentials = {
        accessKeyId: rawAccessKey,
        secretAccessKey: rawSecret,
        ...(rawSession ? { sessionToken: rawSession } : {}),
      }
      this.logger.log(`Using AWS credentials from env (accessKeyId length=${rawAccessKey.length})`)
    }

    this.client = new S3Client(clientOpts)
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType?: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }))
    return key
  }

  async getObjectStream(key: string) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    return res.Body as Readable
  }

  async deleteObject(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  async list(prefix?: string) {
    const res = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }))
    return res.Contents || []
  }

  async getPresignedPutUrl(key: string, expiresSeconds = 900) {
    const cmd = new PutObjectCommand({ Bucket: this.bucket, Key: key })
    return getSignedUrl(this.client, cmd, { expiresIn: expiresSeconds })
  }

  async getPresignedGetUrl(key: string, expiresSeconds = 900) {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    return getSignedUrl(this.client, cmd, { expiresIn: expiresSeconds })
  }
}
