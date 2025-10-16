const StatusService = require("../../services/StatusService");
const statusService = new StatusService();

async function addStatusHandler(request, h) {
  try {
    const packageId = Number(request.params.packageId);
    const { status, batchId } = request.payload;

    if (isNaN(packageId)) {
      throw new Error("packageId harus berupa angka");
    }

    const allowedStatuses = [1, 2, 5, 6, 7];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Status ${status} tidak diizinkan melalui endpoint ini`);
    }

    await statusService.addStatus(packageId, status, batchId);

    return h
      .response({
        status: "success",
        message: `Status ${status} berhasil diterapkan untuk paket ${packageId}`,
      })
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
      .response({
        status: "success",
        message: `Semua paket dalam batch ${batchId} berhasil diupdate ke status 3`,
      })
      .code(200);
  } catch (error) {
    return h
      .response({ status: "fail", message: error.message })
      .code(400);
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
      .response({
        status: "success",
        message: `Semua paket dalam batch ${batchId} berhasil diupdate ke status 4`,
      })
      .code(200);
  } catch (error) {
    return h
      .response({ status: "fail", message: error.message })
      .code(400);
  }
}

async function getLatestStatusHandler(request, h) {
  try {
    const { packageId } = request.params;

    const latest = await statusService.getLatestStatus(packageId);
    return h
      .response({
        status: "success",
        packageId,
        latest,
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
}

module.exports = {
  addStatusHandler,
  addBatchStatusHandler3,
  addBatchStatusHandler4,
  getLatestStatusHandler,
};