const {
  getTotalByBatchAndKodeHandler,
  getTotalFinishedHandler,
  getTotalUnfinishedHandler,
  addPaymentMethodHandler,

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
  {
    method: "POST",
    path: "/finance/payment_method",
    handler: addPaymentMethodHandler,
  },
];

module.exports = financeRoutes;