const {
  addStatusHandler,
  addBatchStatusHandler3,
  addBatchStatusHandler4,
  getLatestStatusHandler,
} = require("./handler");

const statusRoutes = [
  // Update status individu (1, 2, 5, 6, 7)
  {
    method: "PATCH",
    path: "/packages/{packageId}/status",
    handler: addStatusHandler,
  },

  // Update semua paket dalam batch ke status 3
  {
    method: "PATCH",
    path: "/batches/{batchId}/status3",
    handler: addBatchStatusHandler3,
  },

  // Update semua paket dalam batch ke status 4
  {
    method: "PATCH",
    path: "/batches/{batchId}/status4",
    handler: addBatchStatusHandler4,
  },

  // Ambil status terbaru sebuah paket
  {
    method: "GET",
    path: "/packages/{packageId}/status/latest",
    handler: getLatestStatusHandler,
  },
];

module.exports = statusRoutes;