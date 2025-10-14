const {
  createBatchKapal,
  createBatchPesawat,
  insertBatchPackages,
  addPackageToBatch,
  getAllBatchesKapal,
  getAllBatchesPesawat,
  getBatchKapalWithPackages,
  getBatchPesawatWithPackages,
  addPackageToKarung,
  addKarungToBatch,
  getBatchWithKarung,
  getPackagesByKarung,
} = require("../../services/BatchesService");

const NotFoundError = require("../../exceptions/NotFoundError");

const db = require("../../db");

// Handler untuk membuat batch kapal
async function createBatchKapalHandler(request, h) {
  try {
    const { packageIds, nama_kapal, tanggal_closing, tanggal_berangkat, vendor, userId } = request.payload;

    // Buat batch kapal
    const { batchId, totalWeight, totalValue, via } = await createBatchKapal(
      packageIds,
      nama_kapal,
      tanggal_closing,
      tanggal_berangkat,
      vendor,
      userId,
    );

    // Insert paket ke pivot table batch_packages
    await insertBatchPackages(batchId, packageIds, via);

    return h.response({
      success: true,
      data: { batchId, totalWeight, totalValue, via }
    }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ success: false, message: err.message }).code(400);
  }
}

// Handler untuk membuat batch pesawat
async function createBatchPesawatHandler(request, h) {
  try {
    const { packageIds, namaPIC, tanggalKirim, namaVendor, userId } = request.payload;

    // Buat batch pesawat
    const { batchId, totalWeight, totalValue, via } = await createBatchPesawat(
      packageIds,
      namaPIC,
      tanggalKirim,
      namaVendor,
      userId
    );

    // Insert paket ke pivot table batch_packages
    await insertBatchPackages(batchId, packageIds, via);

    return h.response({
      success: true,
      data: { batchId, totalWeight, totalValue, via }
    }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ success: false, message: err.message }).code(400);
  }
}

async function addPackageToKapalHandler(req, h) {
  try {
    const { batchId } = req.params;
    const { resi } = req.payload;

    // Ambil paket berdasarkan resi dulu
    const packageData = await db("packages").where({ resi }).first();
    if (!packageData) {
      throw new Error(`Paket dengan resi ${resi} tidak ditemukan`);
    }

    // Cek via paket
    if (packageData.via === "Pesawat") {
      throw new Error("INI PAKET PESAWAT!");
    }

    const result = await addPackageToBatch(batchId, resi, "Kapal");
    return h.response(result).code(201);
  } catch (err) {
    console.error("Error addPackageToKapalHandler:", err);
    return h.response({ success: false, message: err.message }).code(400);
  }
}

async function addPackageToPesawatHandler(req, h) {
  try {
    const { batchId } = req.params;
    const { resi } = req.payload;

    // Ambil paket berdasarkan resi dulu
    const packageData = await db("packages").where({ resi }).first();
    if (!packageData) {
      throw new Error(`Paket dengan resi ${resi} tidak ditemukan`);
    }

    // Cek via paket
    if (packageData.via === "Kapal") {
      throw new Error("INI PAKET KAPAL!");
    }

    const result = await addPackageToBatch(batchId, resi, "Pesawat");
    return h.response(result).code(201);
  } catch (err) {
    console.error("Error addPackageToKapalHandler:", err);
    return h.response({ success: false, message: err.message }).code(400);
  }
}

async function getAllBatchesKapalHandler(request, h) {
  try {
    const batches = await getAllBatchesKapal();
    return h.response({ success: true, data: batches }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ success: false, message: err.message }).code(400);
  }
}

async function getAllBatchesPesawatHandler(request, h) {
  try {
    const batches = await getAllBatchesPesawat();
    return h.response({ success: true, data: batches }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ success: false, message: err.message }).code(400);
  }
}

async function getAllBatchesKapalWithPackagesHandler(request, h) {
  try {
    const { batchId } = request.params;
    const batch = await getBatchKapalWithPackages(batchId);
    if (!batch) {
      return h.response({ success: false, message: "Batch tidak ditemukan" }).code(404);
    }
    return h.response({ success: true, data: batch }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ success: false, message: err.message }).code(400);
  }
}

async function getAllBatchesPesawatWithPackagesHandler(request, h) {
  try {
    const { batchId } = request.params;
    const batch = await getBatchPesawatWithPackages(batchId);
    if (!batch) {
      return h.response({ success: false, message: "Batch tidak ditemukan" }).code(404);
    }
    return h.response({ success: true, data: batch }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ success: false, message: err.message }).code(400);
  }
}

const addPackageToKarungHandler = async (request, h) => {
  try {
    const { batchId } = request.params;
    const { resi, noKarung } = request.payload;

    const result = await addPackageToKarung(batchId, resi, noKarung);

    return h.response({
      status: "success",
      message: result.message,
    }).code(200);
  } catch (err) {
    console.error("Error addPackageToKarungHandler:", err);

    if (err.name === "NotFoundError" || err.name === "InvariantError") {
      return h.response({
        status: "fail",
        message: err.message,
      }).code(400);
    }

    return h.response({
      status: "error",
      message: "Gagal menambahkan paket ke karung",
      detail: err.message,
    }).code(500);
  }
};

const addKarungToBatchHandler = async (request, h) => {
  const { batchId } = request.params;
  const { noKarung } = request.payload;

  try {
    const karung = await addKarungToBatch(batchId, noKarung);

    return h.response({
      status: "success",
      message: "Karung berhasil ditambahkan",
      data: karung,
    }).code(201);
  } catch (err) {
    console.error("Error addKarungToBatchHandler:", err);

    if (err.name === "InvariantError") {
      return h.response({ status: "fail", message: err.message }).code(400);
    }

    return h.response({
      status: "error",
      message: "Gagal menambahkan karung",
      detail: err.message,
    }).code(500);
  }
};

const getBatchWithKarungHandler = async (request, h) => {
  const { batchId } = request.params;

  try {
    const batch = await getBatchWithKarung(batchId);
    if (!batch) {
      return h.response({
        status: "fail",
        message: "Batch tidak ditemukan",
      }).code(404);
    }

    return h.response({
      status: "success",
      data: batch,
    }).code(200);
  } catch (err) {
    console.error("Error in getBatchWithKarung:", err);
    return h.response({
      status: "error",
      message: "Gagal mengambil batch",
    }).code(500);
  }
};

const getPackagesByKarungHandler = async (request, h) => {
  try {
    const { batchId, noKarung } = request.params;
    const { search } = request.query;

    const result = await getPackagesByKarung(batchId, noKarung, search);

    return h
      .response({
        status: "success",
        message: `Daftar paket dalam karung ${noKarung}`,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error("Error getPackagesByKarungHandler:", err);

    if (err instanceof NotFoundError) {
      return h.response({ status: "fail", message: err.message }).code(404);
    }

    return h
      .response({
        status: "error",
        message: "Gagal mengambil data paket",
        detail: err.message,
      })
      .code(500);
  }
};

module.exports = { 
  createBatchKapalHandler,
  createBatchPesawatHandler,
  addPackageToKapalHandler,
  addPackageToPesawatHandler,
  getAllBatchesKapalHandler,
  getAllBatchesPesawatHandler,
  getAllBatchesKapalWithPackagesHandler,
  getAllBatchesPesawatWithPackagesHandler,
  addPackageToKarungHandler,
  addKarungToBatchHandler,
  getBatchWithKarungHandler,
  getPackagesByKarungHandler,
};