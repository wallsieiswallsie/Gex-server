const { uploadPhotoHandler } = require('./handler');

const storageRoutes = [
  {
    method: 'POST',
    path: '/packages/{id}/photo',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        maxBytes: 5 * 1024 * 1024, // 5 MB limit
      },
    },
    handler: uploadPhotoHandler,
  },
];

module.exports = storageRoutes;