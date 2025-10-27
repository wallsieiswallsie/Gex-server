const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEY_FILE,
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

async function uploadToGCS(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));

    const { originalname, buffer, mimetype } = file;
    const blob = bucket.file(Date.now() + '-' + originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
      public: true,
      metadata: { contentType: mimetype },
    });

    blobStream.on('error', reject);
    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(buffer);
  });
}

module.exports = { uploadToGCS };