const { 
  createBatchKapalHandler,
  createBatchPesawatHandler,
  getAllBatchesKapalHandler,
  addPackageToPesawatHandler,
  getAllBatchesPesawatHandler,
  getAllBatchesKapalWithPackagesHandler,
  getAllBatchesPesawatWithPackagesHandler,
  addPackageToKarungHandler,
  addKarungToBatchHandler,
  getBatchWithKarungHandler,
  getPackagesByKarungHandler,
  movePackageToKarungHandler,
} = require("./handler");

const batchRoutes = [
  {
    method: "POST",
    path: "/batches/kapal",
    handler: createBatchKapalHandler,
  },
  {
    method: "POST",
    path: "/batches/pesawat",
    handler: createBatchPesawatHandler,
  },
  {
    method: "POST",
    path: "/batches/pesawat/{batchId}/packages",
    handler: addPackageToPesawatHandler,
  },
  {
    method: "GET",
    path: "/batches/kapal",
    handler: getAllBatchesKapalHandler,
  },
  {
    method: "GET",
    path: "/batches/pesawat",
    handler: getAllBatchesPesawatHandler,
  },
  {
    method: "GET",
    path: "/batches/kapal/{batchId}",
    handler: getAllBatchesKapalWithPackagesHandler,
  },
  {
    method: "GET",
    path: "/batches/pesawat/{batchId}",
    handler: getAllBatchesPesawatWithPackagesHandler,
  },
  {
    method: "POST",
    path: "/batches/kapal/{batchId}/karung/add-package",
    handler: addPackageToKarungHandler,
  },
  {
    method: "POST",
    path: "/batches/kapal/{batchId}/karung",
    handler: addKarungToBatchHandler,
  },
  {
    method: "GET",
    path: "/batches/kapal/{batchId}/karung",
    handler: getBatchWithKarungHandler,
  },
  {
    method: "GET",
    path: "/batches/kapal/{batchId}/karung/{noKarung}/packages",
    handler: getPackagesByKarungHandler,
  },
  {
    method: "POST",
    path: "/batches/kapal/{batchId}/karung/move-package",
    handler: movePackageToKarungHandler,
  },

];

module.exports = batchRoutes;