const InvoicesService = require("../../services/InvoicesService");
const NotFoundError = require("../../exceptions/NotFoundError");
const service = new InvoicesService();

const createInvoiceHandler = async (request, h) => {
  const { packageIds, nama_invoice } = request.payload;
  const result = await service.createInvoice(packageIds, nama_invoice);

  return h.response({
    status: "success",
    message: "Invoice berhasil dibuat",
    data: result,
  }).code(201);
};

const getAllInvoicesHandler = async (request, h) => {
  const invoices = await service.getAllInvoices();
  return h.response({ status: "success", data: invoices });
};

const getArchivedInvoicesHandler = async (request, h) => {
  try {
    const archivedInvoices = await service.getArchivedInvoices();
    return h.response({
      status: "success",
      data: archivedInvoices,
    }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({
      status: "error",
      message: err.message || "Gagal mengambil invoice arsip",
    }).code(err.status || 500);
  }
};

const getInvoiceByIdHandler = async (request, h) => {
  const { id } = request.params;
  try {
    const result = await service.getInvoiceById(id);

    if (!result) {
      return h.response({
        status: "fail",
        message: "Invoice tidak ditemukan",
      }).code(404);
    }

    return h.response({
      status: "success",
      data: result,
    }).code(200);
  } catch (err) {
    console.error("Error getInvoiceByIdHandler:", err.message);
    return h.response({
      status: "error",
      message: err.message,
    }).code(500);
  }
};

const removePackageFromInvoiceHandler = async (request, h) => {
  const { id, packageId } = request.params;
  try {
      const result = await service.removePackageFromInvoice(id, Number(packageId));
      return h.response({ status: "success", data: result }).code(200);
    } catch (err) {
      console.error("Error removePackageFromInvoice:", err.message);
      return h.response({ status: "error", message: err.message }).code(
        err instanceof NotFoundError ? 404 : 500
      );
    }
};

const addPackagesByResiToExistingInvoiceHandler = async (request, h) => {
  const { id } = request.params;
  const { resiList } = request.payload;

  try {
    if (!resiList || !Array.isArray(resiList) || resiList.length === 0) {
      return h.response({
        status: "fail",
        message: "Daftar resi harus berupa array dan tidak boleh kosong",
      }).code(400);
    }

    const result = await service.addPackagesByResiToExistingInvoice(id, resiList);

    return h.response({
      status: "success",
      message: result.message,
      data: result,
    }).code(200);
  } catch (err) {
    console.error("Error addPackagesByResiToExistingInvoiceHandler:", err.message);
    return h.response({
      status: "error",
      message: err.message,
    }).code(
      err instanceof NotFoundError ? 404 :
      err.name === "InvariantError" ? 400 : 500
    );
  }
};

const archiveInvoicesHandler = async (request, h) => {
  try {
    // Ambil array invoiceIds dari body request
    const { invoiceIds, paymentMethod } = request.payload;

    // Panggil service untuk arsip paket dari invoice
    const result = await service.archivePackagesByInvoices(invoiceIds, paymentMethod);

    return h.response({
      status: "success",
      message: result.message,
      data: {
        invoiceIds: result.invoiceIds,
        archivedPackageIds: result.archivedPackageIds,
      },
    }).code(200);

  } catch (err) {
    // Tangani error sesuai jenisnya
    if (err.name === "NotFoundError") {
      return h.response({
        status: "fail",
        message: err.message,
      }).code(404);
    }

    if (err.name === "InvariantError") {
      return h.response({
        status: "fail",
        message: err.message,
      }).code(400);
    }

    // Error lain dianggap server error
    console.error(err);
    return h.response({
      status: "error",
      message: "Terjadi kesalahan pada server",
    }).code(500);
  }
};

module.exports = {
  createInvoiceHandler,
  getAllInvoicesHandler,
  getArchivedInvoicesHandler,
  getInvoiceByIdHandler,
  removePackageFromInvoiceHandler,
  addPackagesByResiToExistingInvoiceHandler,
  archiveInvoicesHandler,
};