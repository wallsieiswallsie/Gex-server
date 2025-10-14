const StatusService = require("../../services/StatusService");
const statusService = new StatusService();

async function addStatusHandler(request, h) {
    try {
        const packageId = Number(request.params.packageId);
        const { status, batchId } = request.payload; // batchId opsional untuk status 1

        if (isNaN(packageId)) {
            throw new Error("packageId harus angka");
        }

        await statusService.addStatus(packageId, status, batchId);

        return h
            .response({ status: "success", message: `Status ${status} berhasil diterapkan` })
            .code(200);
    } catch (error) {
        return h
            .response({ status: "fail", message: error.message })
            .code(400);
    }
}

async function addBatchStatusHandler3(request, h) {
  try {
    const { batchId } = request.params;
    const { status } = request.payload;

    if (status !== 3) {
      throw new Error("Hanya mendukung status 3 untuk batch");
    }

    await statusService.addStatus(null, status, batchId);

    return h
      .response({ status: "success", message: `Semua paket batch ${batchId} berhasil update ke status ${status}` })
      .code(200);
  } catch (error) {
    return h.response({ status: "fail", message: error.message }).code(400);
  }
}

async function addBatchStatusHandler4(request, h) {
  try {
    const { batchId } = request.params;
    const { status } = request.payload;

    if (status !== 4) {
      throw new Error("Hanya mendukung status 4 untuk batch");
    }

    await statusService.addStatus(null, status, batchId);

    return h
      .response({ status: "success", message: `Semua paket batch ${batchId} berhasil update ke status ${status}` })
      .code(200);
  } catch (error) {
    return h.response({ status: "fail", message: error.message }).code(400);
  }
}

async function getLatestStatusHandler(request, h) {
    try {
        const { packageId } = request.params;

        const latest = await statusService.getLatestStatus(packageId);
        console.log("request.params:", request.params);
        console.log("packageId:", packageId);
        return h.response({
            status: "success",
            packageId,
            latest,
        }).code(200);
    } catch (err) {
        return h.response({
            status: "fail",
            message: err.message,
        }).code(400);
    }
}

module.exports = { 
    addStatusHandler,
    addBatchStatusHandler3,
    addBatchStatusHandler4,
   // getPackageStatusesHandler,
    getLatestStatusHandler
};