import { Controller, Post, UseInterceptors, UploadedFile, Param, Get, Res, Body, Query, HttpCode, Logger } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { S3Service } from '../s3/s3.service'
import { ProjectFilesService } from './files.service'
import { Response } from 'express'
import * as multer from 'multer'

@Controller('projects/:projectId/files')
export class ProjectFilesController {
  private readonly logger = new Logger(ProjectFilesController.name)
  constructor(private s3: S3Service, private filesService: ProjectFilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadViaBackend(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    // allow client to supply a friendly projectName to create a folder name
    const rawName = (body && body.projectName) ? String(body.projectName) : projectId
    const tabRaw = (body && body.tabName) ? String(body.tabName) : null
    const sanitize = (s: string) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || projectId
    const folder = sanitize(rawName)
    const tabFolder = tabRaw ? sanitize(tabRaw) : null
    const key = tabFolder ? `projects/${folder}/${tabFolder}/${Date.now()}_${file.originalname}` : `projects/${folder}/${Date.now()}_${file.originalname}`
    await this.s3.uploadBuffer(key, file.buffer, file.mimetype)
    const saved = await this.filesService.create({
      projectId,
      s3Key: key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    })
    return { key, id: saved.id }
  }

  @Post('presign')
  async presign(@Param('projectId') projectId: string, @Body() body: { filename: string; projectName?: string; tabName?: string }) {
    const rawName = (body && body.projectName) ? String(body.projectName) : projectId
    const tabRaw = (body && body.tabName) ? String(body.tabName) : null
    const sanitize = (s: string) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || projectId
    const folder = sanitize(rawName)
    const tabFolder = tabRaw ? sanitize(tabRaw) : null
    const key = tabFolder ? `projects/${folder}/${tabFolder}/${Date.now()}_${body.filename}` : `projects/${folder}/${Date.now()}_${body.filename}`
    const url = await this.s3.getPresignedPutUrl(key)
    this.logger.log(`presign -> projectId=${projectId} folder=${folder} tab=${tabFolder} key=${key} url=${url}`)
    return { key, url }
  }

  @Post('metadata')
  async saveMetadata(@Param('projectId') projectId: string, @Body() body: { key: string; originalName: string; mimeType?: string; size?: number; uploadedBy?: string; qualificationId?: string; capacityId?: string; companyId?: string }) {
    this.logger.log(`saveMetadata called for project=${projectId} body=${JSON.stringify(body)}`)
    // If a qualificationId is provided, try to replace existing file for that qualification
    if (body.qualificationId) {
      const existing = await this.filesService.findByQualification(projectId, body.qualificationId)
      if (existing) {
        // delete old S3 object if key changed
        try {
          if (existing.s3Key && existing.s3Key !== body.key) await this.s3.deleteObject(existing.s3Key)
        } catch (e) {
          this.logger.warn(`Failed to delete old S3 object ${existing.s3Key}: ${e}`)
        }
        const updated = await this.filesService.update(existing.id, {
          s3Key: body.key,
          originalName: body.originalName,
          mimeType: body.mimeType || 'application/octet-stream',
          size: body.size || 0,
          uploadedBy: body.uploadedBy,
          companyId: body.companyId,
          capacityId: body.capacityId,
        })
        this.logger.log(`Updated existing file id=${existing.id} -> key=${updated?.s3Key} originalName=${updated?.originalName}`)
        return updated
      }
    }

    // If a capacityId is provided, try to replace existing file for that capacity
    if (body.capacityId) {
      const existing = await this.filesService.findByCapacity(projectId, body.capacityId)
      if (existing) {
        try {
          if (existing.s3Key && existing.s3Key !== body.key) await this.s3.deleteObject(existing.s3Key)
        } catch (e) {
          this.logger.warn(`Failed to delete old S3 object ${existing.s3Key}: ${e}`)
        }
        const updated = await this.filesService.update(existing.id, {
          s3Key: body.key,
          originalName: body.originalName,
          mimeType: body.mimeType || 'application/octet-stream',
          size: body.size || 0,
          uploadedBy: body.uploadedBy,
          companyId: body.companyId,
        })
        this.logger.log(`Updated existing file id=${existing.id} -> key=${updated?.s3Key} originalName=${updated?.originalName}`)
        return updated
      }
    }

    const saved = await this.filesService.create({
      projectId,
      s3Key: body.key,
      originalName: body.originalName,
      mimeType: body.mimeType || 'application/octet-stream',
      size: body.size || 0,
      uploadedBy: body.uploadedBy,
      qualificationId: body.qualificationId,
      capacityId: body.capacityId,
      companyId: body.companyId,
    })
    this.logger.log(`Created file id=${saved.id} -> key=${saved.s3Key} originalName=${saved.originalName} capacityId=${saved.capacityId} qualificationId=${saved.qualificationId}`)
    return saved
  }

  @Get()
  async list(@Param('projectId') projectId: string) {
    return this.filesService.listByProject(projectId)
  }

  @Get('presign-get')
  async presignGet(@Query('key') key: string) {
    const url = await this.s3.getPresignedGetUrl(key)
    return { url }
  }

  @Get('download')
  async download(@Query('key') key: string, @Res() res: Response) {
    const stream = await this.s3.getObjectStream(key)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(key.split('/').pop() || 'file')}"`)
    ;(stream as any).pipe(res)
  }
}
