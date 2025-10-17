const FinanceService = require("../../services/FinanceService");
const financeService = new FinanceService();

// 🔹 GET /finance/{idBatch}/{kode}/total
const getTotalByBatchAndKodeHandler = async (request, h) => {
  try {
    const { idBatch, kode } = request.params;

    const total = await financeService.getTotalByBatchAndKode(idBatch, kode);
    return h
      .response({
        status: "success",
        data: { idBatch, kode, total_harga: total },
      })
      .code(200);
  } catch (err) {
    console.error("getTotalByBatchAndKodeHandler error:", err);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

// 🔹 GET /finance/{idBatch}/{kode}/finished
const getTotalFinishedHandler = async (request, h) => {
  try {
    const { idBatch, kode } = request.params;

    const total = await financeService.getTotalFinished(idBatch, kode);
    return h
      .response({
        status: "success",
        data: { idBatch, kode, total_finished: total },
      })
      .code(200);
  } catch (err) {
    console.error("getTotalFinishedHandler error:", err);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

// 🔹 GET /finance/{idBatch}/{kode}/unfinished
const getTotalUnfinishedHandler = async (request, h) => {
  try {
    const { idBatch, kode } = request.params;

    const total = await financeService.getTotalUnfinished(idBatch, kode);
    return h
      .response({
        status: "success",
        data: { idBatch, kode, total_unfinished: total },
      })
      .code(200);
  } catch (err) {
    console.error("getTotalUnfinishedHandler error:", err);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

module.exports = {
  getTotalByBatchAndKodeHandler,
  getTotalFinishedHandler,
  getTotalUnfinishedHandler,
};