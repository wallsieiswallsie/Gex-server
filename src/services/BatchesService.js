const db = require("../db");
const { generateIdBatchesKapal, generateIdBatchesPesawat } = require("../utils/generateBatchesId");
const { calculateBatchDetails } = require("../utils/calculations");
const StatusService = require("./StatusService");
const statusService = new StatusService();
const NotFoundError = require("../exceptions/NotFoundError");
const InvariantError = require("../exceptions/InvariantError");


async function insertBatchPackages(batchId, packageIds, via) {
  if (!packageIds || packageIds.length === 0) return;

  const rows = packageIds.map((pkgId) => ({
    id_batch: batchId,
    package_id: pkgId,
    via,
  }));

  await db("batch_packages").insert(rows);
  for (const pkgId of packageIds) {
    await statusService.addStatus(pkgId, 2, batchId);
  }
}

async function addPackageToBatch(batchId, resi, via = "Pesawat") {
  let packageId = null;
  let shouldAddStatus = false;

  await db.transaction(async (trx) => {
    // 1️⃣ Ambil data paket
    const packageData = await trx("packages").where({ resi }).first();
    if (!packageData) {
      throw new Error(`Paket dengan resi ${resi} tidak ditemukan`);
    }
    packageId = packageData.id;

    // 2️⃣ Cek apakah paket sudah ada di batch ini
    const exists = await trx("batch_packages")
      .where({ id_batch: batchId, package_id: packageId })
      .first();

    if (exists) {
      throw new Error(`Paket dengan resi ${resi} sudah ada di batch ini`);
    }

    // 3️⃣ Insert ke batch_packages (tanpa no_karung karena ini pesawat)
    await trx("batch_packages").insert({
      id_batch: batchId,
      package_id: packageId,
      via: "Pesawat",
    });

    // 4️⃣ Ambil semua paket di batch pesawat ini
    const packagesInBatch = await trx("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", batchId)
      .select("p.berat_dipakai", "p.harga");

    const { totalWeight, totalValue } = calculateBatchDetails(packagesInBatch);

    // 5️⃣ Update total batch pesawat
    const updated = await trx("batches_pesawat")
      .where("id", batchId)
      .update({ total_berat: totalWeight, total_value: totalValue });

    if (!updated) {
      throw new Error(`Batch pesawat dengan ID ${batchId} tidak ditemukan`);
    }

    // tandai bahwa setelah commit, status perlu ditambahkan
    shouldAddStatus = true;
  });

  // 6️⃣ Jalankan setelah transaksi selesai (di luar trx)
  if (shouldAddStatus && packageId) {
    await statusService.addStatus(packageId, 2, batchId);
  }

  return {
    success: true,
    message: `Paket ${resi} berhasil ditambahkan ke batch pesawat`,
  };
}

async function createBatchKapal(
  packageIds = [],
  namaKapal,
  tanggalClosing,
  tanggalBerangkat,
  namaVendor,
  userId) {
  let totalWeight = 0;
  let totalValue = 0;

  if (packageIds.length > 0) {
    // Ambil semua paket
    const packages = await db("packages").whereIn("id", packageIds);

    if (packages.length !== packageIds.length) {
      throw new Error("Beberapa package tidak ditemukan");
    }

    // Hitung total berat dan total value
    const details = calculateBatchDetails(packages);
    totalWeight = details.totalWeight;
    totalValue = details.totalValue;
  }

  // Generate ID batch kapal
  const batchKapalId = generateIdBatchesKapal();

  // Insert ke tabel batches_kapal
  const [batchId] = await db("batches_kapal")
    .insert({
      id: batchKapalId,
      nama_kapal: namaKapal,
      tanggal_closing: tanggalClosing,
      tanggal_berangkat: tanggalBerangkat,
      via: "Kapal",
      vendor: namaVendor,
      total_berat: totalWeight,
      total_value: totalValue,
      created_by: userId,
      updated_by: userId,
    })
    .returning("id");

  return { batchId, totalWeight, totalValue };
}

async function createBatchPesawat(
  packageIds = [],
  namaPIC,
  tanggalKirim,
  namaVendor,
  userId) {
  let totalWeight = 0;
  let totalValue = 0;
  let batchVia = null;

  if (packageIds.length > 0) {
    // Ambil semua paket
    const packages = await db("packages").whereIn("id", packageIds);

    if (packages.length !== packageIds.length) {
      throw new Error("Beberapa package tidak ditemukan");
    }

    // Hitung total berat dan total value
    const details = calculateBatchDetails(packages);
    totalWeight = details.totalWeight;
    totalValue = details.totalValue;
  }

  // Generate ID batch pesawat
  const batchPesawatId = generateIdBatchesPesawat();

  // Insert ke tabel batches_pesawat
  const [batchId] = await db("batches_pesawat")
    .insert({
      id: batchPesawatId,
      pic: namaPIC,
      tanggal_kirim: tanggalKirim,
      via: "Pesawat",
      vendor: namaVendor,
      total_berat: totalWeight,
      total_value: totalValue,
      created_by: userId,
      updated_by: userId,
    })
    .returning("id");

  return { batchId, totalWeight, totalValue };
}

async function getAllBatchesKapal() {
  const batches = await db("batches_kapal")
    .select(
      "id",
      "nama_kapal",
      "tanggal_closing",
      "tanggal_berangkat",
      "via",
      "vendor",
      "total_berat",
      "total_value"
    )
    .orderBy("tanggal_berangkat", "desc");
  return batches;
}

async function getAllBatchesPesawat() {
  const batches = await db("batches_pesawat")
    .select(
      "id",
      "pic",
      "tanggal_kirim",
      "via",
      "vendor",
      "total_berat",
      "total_value"
    )
    .orderBy("tanggal_kirim", "desc");
  return batches;
}

// Ambil 1 batch kapal beserta paketnya
async function getBatchKapalWithPackages(batchId) {
  const batch = await db("batches_kapal")
    .where("id", batchId)
    .first();

  if (!batch) return null;

  const packages = await db("batch_packages as bp")
    .join("packages as p", "bp.package_id", "p.id")
    .where("bp.id_batch", batchId)
    .select(
      "p.id as package_id",
      "p.nama",
      "p.resi",
      "p.berat_dipakai",
      "p.harga"
    );

  return { ...batch, packages };
}

// Ambil 1 batch pesawat beserta paketnya
async function getBatchPesawatWithPackages(batchId) {
  const batch = await db("batches_pesawat")
    .where("id", batchId)
    .first();

  if (!batch) return null;

  const packages = await db("batch_packages as bp")
    .join("packages as p", "bp.package_id", "p.id")
    .where("bp.id_batch", batchId)
    .select(
      "p.id as package_id",
      "p.nama",
      "p.resi",
      "p.berat_dipakai",
      "p.harga"
    );

  return { ...batch, packages };
}

  async function addPackageToKarung(batchId, resi, noKarung) {
    // simpan id paket & flag untuk status setelah commit
    let paketId = null;
    let shouldAddStatus = false;

    // lakukan semua perubahan DB dalam trx
    await db.transaction(async (trx) => {
      // 1. ambil paket
      const paket = await trx("packages").where({ resi }).first();
      if (!paket) throw new NotFoundError("Paket tidak ditemukan");
      paketId = paket.id;

      // 2. ambil karung di batch (cek karung memang milik batch ini)
      const karung = await trx("karung").where({ id_batch: batchId, no_karung: noKarung }).first();
      if (!karung) throw new NotFoundError("Karung tidak ditemukan di batch ini");

      // 3. cek apakah paket sudah ada di karung lain
      const existingInKarung = await trx("package_karung").where({ package_id: paket.id }).first();
      if (existingInKarung) {
        throw new InvariantError("Paket sudah ada di karung lain");
      }

      // 4. pastikan paket sudah ada di batch_packages — kalau belum, insert
      const existsInBatch = await trx("batch_packages")
        .where({ id_batch: batchId, package_id: paket.id })
        .first();

      if (!existsInBatch) {
        // insert ke batch_packages
        await trx("batch_packages").insert({
          id_batch: batchId,
          package_id: paket.id,
          via: "Kapal", // atau ambil dari paket.via jika diperlukan
          no_karung: noKarung,
        });

        // setelah kita memasukkan paket ke batch, kita harus update total berat & value
        // ambil semua paket di batch untuk hitung ulang
        const packagesInBatch = await trx("batch_packages as bp")
          .join("packages as p", "bp.package_id", "p.id")
          .where("bp.id_batch", batchId)
          .select("p.berat_dipakai", "p.harga");

        const { totalWeight, totalValue } = calculateBatchDetails(packagesInBatch);

        // update tabel batch kapal
        await trx("batches_kapal")
          .where("id", batchId)
          .update({ total_berat: totalWeight, total_value: totalValue });
      }

      // 5. masukkan ke package_karung (relasi karung-paket)
      await trx("package_karung").insert({
        karung_id: karung.id,
        package_id: paket.id,
      });

      // tandai agar status ditambahkan setelah trx commit
      shouldAddStatus = true;
    });

    // 6. setelah transaksi commit, panggil statusService (di luar trx)
    //    agar StatusService melihat data batch_packages yang sudah committed.
    if (shouldAddStatus) {
      await statusService.addStatus(paketId, 2, batchId);
    }

    return { success: true, message: `Paket ${resi} berhasil masuk ke karung ${noKarung}` };
  }

async function addKarungToBatch(batchId, noKarung) {
  const batch = await db("batches_kapal").where({ id: batchId }).first();
  if (!batch) throw new NotFoundError("Batch tidak ditemukan");

  const existing = await db("karung").where({ id_batch: batchId, no_karung: noKarung }).first();
  if (existing) throw new InvariantError("Nomor karung sudah ada di batch ini");

  const [inserted] = await db("karung")
    .insert({ id_batch: batchId, no_karung: noKarung })
    .returning("*");

  return inserted;
}

async function getBatchWithKarung(batchId) {
  // ambil info batch
  const batch = await db("batches_kapal")
    .where({ id: batchId })
    .first();

  if (!batch) throw new NotFoundError("Batch tidak ditemukan");

  // ambil daftar karung (tetap ambil walau package_id NULL)
  const karungRows = await db("karung as k")
  .leftJoin("package_karung as pk", "k.id", "pk.karung_id")
  .leftJoin("packages as p", "pk.package_id", "p.id")
  .select(
    "k.id as karung_id",
    "k.no_karung",
    "k.id_batch",
    "p.id as package_id",
    "p.resi"
  )
  .where("k.id_batch", batchId);


  // group by karung
  const karungMap = {};
  karungRows.forEach((row) => {
    if (!karungMap[row.karung_id]) {
      karungMap[row.karung_id] = {
        id: row.karung_id,
        no_karung: row.no_karung,
        packages: [],
      };
    }
    if (row.package_id) {
      karungMap[row.karung_id].packages.push({
        id: row.package_id,
        resi: row.resi,
      });
    }
  });

  return {
    ...batch,
    karung: Object.values(karungMap),
  };
}

async function getPackagesByKarung(batchId, noKarung, searchQuery = "") {
  // Ambil karung berdasarkan batch dan nomor karung
  const karung = await db("karung")
    .where({ id_batch: batchId, no_karung: noKarung })
    .first();

  if (!karung) throw new NotFoundError("Karung tidak ditemukan di batch ini");

  // Ambil semua paket dari package_karung
  let query = db("package_karung as pk")
    .join("packages as p", "pk.package_id", "p.id")
    .select(
      "p.id",
      "p.resi",
      "p.nama",
      "p.berat_dipakai",
      "p.harga",
      "p.created_at"
    )
    .where("pk.karung_id", karung.id);

  // Jika ada query pencarian (nama atau resi)
  if (searchQuery) {
    query = query.where((builder) => {
      builder
        .whereILike("p.nama", `%${searchQuery}%`)
        .orWhereILike("p.resi", `%${searchQuery}%`);
    });
  }

  const packages = await query;

  return { noKarung, batchId, total: packages.length, packages };
}

module.exports = { 
  insertBatchPackages,
  addPackageToBatch,
  createBatchKapal,
  createBatchPesawat,
  getAllBatchesKapal,
  getAllBatchesPesawat,
  getBatchKapalWithPackages,
  getBatchPesawatWithPackages,
  addPackageToKarung,
  addKarungToBatch,
  getBatchWithKarung,
  getPackagesByKarung,
};