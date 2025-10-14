const {
  addStatusHandler,
  addBatchStatusHandler3,
  addBatchStatusHandler4,
 // getPackageStatusesHandler,
  getLatestStatusHandler,
} = require("./handler");

const statusRoutes = [
  { method: "PATCH", path: "/packages/{packageId}/status", handler: addStatusHandler },
  { method: "PATCH", path: "/batches/{batchId}/status3", handler: addBatchStatusHandler3 },
  { method: "PATCH", path: "/batches/{batchId}/status4", handler: addBatchStatusHandler4 },
  
  // new GET routes
  //{ method: "GET", path: "/packages/{packageId}/statuses", handler: getPackageStatusesHandler },
  { method: "GET", path: "/packages/{packageId}/status/latest", handler: getLatestStatusHandler },
];

module.exports = statusRoutes;