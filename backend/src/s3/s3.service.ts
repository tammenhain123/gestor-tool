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

    this.client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: endpointVar || undefined,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
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
