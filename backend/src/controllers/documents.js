import path from 'path'
import fs from 'fs/promises'
import { config } from '../config.js'
import { ingestDocument } from '../services/ingestion.js'
import { uploadFile, deleteFile, buildS3Key } from '../lib/storage.js'

export async function upload(request, reply) {
  const userId = request.user.userId
  const data = await request.file()

  if (!data) return reply.code(400).send({ error: 'No file uploaded' })

  const fileName = data.filename
  const mimeType = data.mimetype
  const uploadDir = config.uploadDir
  await fs.mkdir(uploadDir, { recursive: true })

  const localPath = path.join(uploadDir, `${Date.now()}-${fileName}`)
  const buffer = await data.toBuffer()
  await fs.writeFile(localPath, buffer)

  let filePath = localPath
  let uploadedToS3 = false

  if (config.s3.bucket) {
    try {
      const s3Key = buildS3Key(userId, fileName)
      await uploadFile(localPath, s3Key, mimeType)
      filePath = s3Key
      uploadedToS3 = true
    } catch (err) {
      this.log.warn({ err }, 'S3 upload failed, falling back to local storage')
    }
  }

  const [doc] = await this.queries.documents.create({ userId, fileName, fileType: mimeType, filePath })

  ingestDocument(this.queries, doc.id, userId, localPath, mimeType)
    .then(async () => {
      if (uploadedToS3) await fs.unlink(localPath).catch(() => {})
    })
    .catch(err => {
      this.log.error({ err, documentId: doc.id }, 'Ingestion failed')
    })

  return reply.code(202).send({ id: doc.id, status: 'processing' })
}

export async function list(request) {
  return this.queries.documents.findByUser(request.user.userId)
}

export async function getOne(request, reply) {
  const docs = await this.queries.documents.findById(request.params.id, request.user.userId)
  if (docs.length === 0) return reply.code(404).send({ error: 'Not found' })
  return docs[0]
}

export async function remove(request, reply) {
  const userId = request.user.userId
  const docs = await this.queries.documents.findById(request.params.id, userId)
  if (docs.length === 0) return reply.code(404).send({ error: 'Not found' })

  const doc = docs[0]

  await this.queries.chunks.deleteByDocument(request.params.id)
  await this.queries.sessionDocs.deleteByDocument(request.params.id)
  await this.queries.documents.delete(request.params.id, userId)

  const isS3Key = config.s3.bucket && !path.isAbsolute(doc.filePath) && !doc.filePath.startsWith('.')
  if (isS3Key) {
    await deleteFile(doc.filePath).catch(() => {})
  } else {
    await fs.unlink(doc.filePath).catch(() => {})
  }

  return reply.code(204).send()
}
