const { uploadToGCS } = require('../../services/StorageService');
const db = require('../../db'); // koneksi knex

async function uploadPhotoHandler(request, h) {
  try {
    const { id } = request.params;
    const file = request.payload.photo; // field name = photo

    if (!file) {
      return h.response({
        status: 'fail',
        message: 'No photo file uploaded',
      }).code(400);
    }

    const photoUrl = await uploadToGCS(file);

    await db('packages').where({ id }).update({ photo_url: photoUrl });

    return h.response({
      status: 'success',
      message: 'Photo uploaded successfully',
      data: { photo_url: photoUrl },
    }).code(200);

  } catch (err) {
    console.error(err);
    return h.response({
      status: 'fail',
      message: 'Failed to upload photo',
      error: err.message,
    }).code(500);
  }
}

module.exports = { uploadPhotoHandler };