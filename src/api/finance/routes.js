const {
  getTotalByBatchAndKodeHandler,
  getTotalFinishedHandler,
  getTotalUnfinishedHandler,
} = require("./handler");

const financeRoutes = [
  {
    method: "GET",
    path: "/finance/{batchId}/{kode}/total",
    handler: getTotalByBatchAndKodeHandler,
  },
  {
    method: "GET",
    path: "/finance/{batchId}/{kode}/finished",
    handler: getTotalFinishedHandler,
  },
  {
    method: "GET",
    path: "/finance/{batchId}/{kode}/unfinished",
    handler: getTotalUnfinishedHandler,
  },
];

module.exports = financeRoutes;