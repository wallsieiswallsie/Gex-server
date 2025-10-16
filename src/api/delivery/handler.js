const DeliveryService = require("../../services/DeliveryService");
const deliveryService = new DeliveryService();

const postPengantaranHandler = async (request, h) => {
  try {
    const { invoice_id } = request.payload || {};
    if (!invoice_id) {
      return h.response({ message: "invoice_id wajib" }).code(400);
    }

    const result = await deliveryService.addInvoiceToDelivery(invoice_id);
    if (!result) {
      return h.response({ message: "Invoice tidak ditemukan" }).code(404);
    }

    return h.response(result).code(201);
  } catch (err) {
    console.error("postPengantaranHandler error:", err);
    return h.response({ message: "Terjadi kesalahan server" }).code(500);
  }
};

const addPackageToPengantaranActiveHandler = async (request, h) => {
  const { resi } = request.payload;

  try {
    const result = await deliveryService.addPackageToPengantaranActive(resi);
    return h.response({ status: "success", data: result }).code(200);
  } catch (err) {
    return h
      .response({ status: "fail", message: err.message })
      .code(400);
  }
};

const addPackageToPengantaranArchiveHandler = async (request, h) => {
  const { resi } = request.payload;

  try {
    const result = await deliveryService.addPackageToPengantaranArchive(resi);
    return h.response({ status: "success", data: result }).code(200);
  } catch (err) {
    return h
      .response({ status: "fail", message: err.message })
      .code(400);
  }
};

const getPengantaranByIdHandler = async (request, h) => {
  try {
    const { id } = request.params;
    const invoice = await deliveryService.getInvoiceSummaryById(id);

    if (!invoice) {
      return h.response({ message: "Invoice tidak ditemukan" }).code(404);
    }

    return h.response(invoice).code(200);
  } catch (err) {
    console.error("getPengantaranByIdHandler error:", err);
    return h.response({ message: "Terjadi kesalahan server" }).code(500);
  }
};

// 🔹 GET /pengantaran
const getAllPengantaranHandler = async (request, h) => {
  try {
    const deliveries = await deliveryService.getAllDeliveries();
    return h.response(deliveries).code(200);
  } catch (err) {
    console.error("getAllPengantaranHandler error:", err);
    return h.response({ message: "Terjadi kesalahan server" }).code(500);
  }
};

const getPengantaranActiveHandler = async (request, h) => {
  try {
    const result = await deliveryService.getPengantaranActive();

    return h
      .response({
        status: "success",
        data: result,
      })
      .code(200);
  } catch (err) {
    return h
      .response({
        status: "fail",
        message: err.message,
      })
      .code(400);
  }
};

const getPengantaranArchiveHandler = async (request, h) => {
  try {
    const result = await deliveryService.getPengantaranArchive();

    return h
      .response({
        status: "success",
        data: result,
      })
      .code(200);
  } catch (err) {
    return h
      .response({
        status: "fail",
        message: err.message,
      })
      .code(400);
  }
};

const getPengantaranArchiveByPackageFinishedHandler = async (request, h) => {
  try {
    const service = new DeliveryService();
    const result = await service.getPengantaranArchiveByPackageFinished();

    return h.response({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching archive by package finished:", error);

    return h
      .response({
        status: "fail",
        message: "Terjadi kesalahan pada server",
      })
      .code(500);
  }
};

module.exports = {
  postPengantaranHandler,
  addPackageToPengantaranActiveHandler,
  addPackageToPengantaranArchiveHandler,
  getPengantaranByIdHandler,
  getAllPengantaranHandler,
  getPengantaranActiveHandler,
  getPengantaranArchiveHandler,
  getPengantaranArchiveByPackageFinishedHandler,
};