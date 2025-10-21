const {
  getTotalByBatchAndKodeHandler,
  getTotalFinishedHandler,
  getTotalUnfinishedHandler,
  addPaymentMethodHandler,
  getFinishedGroupedByPaymentMethodHandler,
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
    method: "PATCH",
    path: "/finance/payment_method",
    handler: addPaymentMethodHandler,
  },
  {
    method: "GET",
    path: "/finance/{batchId}/{kode}/finished/grouped",
    handler: getFinishedGroupedByPaymentMethodHandler,
  },
];

module.exports = financeRoutes;