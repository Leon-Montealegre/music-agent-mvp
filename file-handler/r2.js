// r2.js — Cloudflare R2 helper (S3-compatible)
// All file storage goes through these four functions.

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3')

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME

// Upload a Buffer to R2.  Returns the key on success.
async function uploadFile(key, buffer, contentType) {
  await client.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType || 'application/octet-stream',
  }))
  return key
}

// Fetch a file from R2.  Returns the S3 response object — pipe .Body to res.
async function getFile(key) {
  return client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
}

// Delete a single file from R2.
async function deleteFile(key) {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// List all files under a prefix (e.g. "releases/my-ep/artwork/").
// Returns an array of { Key, Size, LastModified } objects (empty if nothing found).
async function listFiles(prefix) {
  const resp = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }))
  return resp.Contents || []
}

module.exports = { uploadFile, getFile, deleteFile, listFiles }
