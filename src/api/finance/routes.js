const {
  getTotalByBatchAndKodeHandler,
  getTotalFinishedHandler,
  getTotalUnfinishedHandler,
} = require("./handler");

const financeRoutes = [
  {
    method: "GET",
    path: "/finance/{idBatch}/{kode}/total",
    handler: getTotalByBatchAndKodeHandler,
  },
  {
    method: "GET",
    path: "/finance/{idBatch}/{kode}/finished",
    handler: getTotalFinishedHandler,
  },
  {
    method: "GET",
    path: "/finance/{idBatch}/{kode}/unfinished",
    handler: getTotalUnfinishedHandler,
  },
];

module.exports = financeRoutes;