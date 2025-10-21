const FinanceService = require("../../services/FinanceService");
const financeService = new FinanceService();

// 🔹 GET /finance/{batchId}/{kode}/total
const getTotalByBatchAndKodeHandler = async (request, h) => {
  try {
    const { batchId, kode } = request.params;

    const total = await financeService.getTotalByBatchAndKode(batchId, kode);
    return h
      .response({
        status: "success",
        data: { batchId, kode, total: total },
      })
      .code(200);
  } catch (err) {
    console.error("getTotalByBatchAndKodeHandler error:", err);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

// 🔹 GET /finance/{batchId}/{kode}/finished
const getTotalFinishedHandler = async (request, h) => {
  try {
    const { batchId, kode } = request.params;

    const total = await financeService.getTotalFinished(batchId, kode);
    return h
      .response({
        status: "success",
        data: { batchId, kode, total: total },
      })
      .code(200);
  } catch (err) {
    console.error("getTotalFinishedHandler error:", err);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

// 🔹 GET /finance/{batchId}/{kode}/unfinished
const getTotalUnfinishedHandler = async (request, h) => {
  try {
    const { batchId, kode } = request.params;

    const total = await financeService.getTotalUnfinished(batchId, kode);
    return h
      .response({
        status: "success",
        data: { batchId, kode, total: total },
      })
      .code(200);
  } catch (err) {
    console.error("getTotalUnfinishedHandler error:", err);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }


};

const addPaymentMethodHandler = async (request, h) => {
  try {
    const { invoice_id, payment_method } = request.payload;

    // Validasi input sederhana
    if (!invoice_id || !payment_method) {
      return h
        .response({
          status: "fail",
          message: "Field invoice_id dan payment_method wajib diisi.",
        })
        .code(400);
    }

    const updatedInvoice = await financeService.addPaymentMethod(
      invoice_id,
      payment_method
    );

    return h
      .response({
        status: "success",
        message: "Payment method berhasil ditambahkan ke invoice.",
        data: updatedInvoice,
      })
      .code(200);
  } catch (err) {
    console.error("addPaymentMethodHandler error:", err);
    return h
      .response({
        status: "fail",
        message: err.message || "Terjadi kesalahan server",
      })
      .code(500);
  }
};

module.exports = {
  getTotalByBatchAndKodeHandler,
  getTotalFinishedHandler,
  getTotalUnfinishedHandler,
  addPaymentMethodHandler,
};