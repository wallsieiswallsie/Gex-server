const db = require("../db");
const {
  generateIdBatchesKapal,
  generateIdBatchesPesawat,
} = require("../utils/generateBatchesId");
const { calculateBatchDetails } = require("../utils/calculations");
const StatusService = require("./StatusService");
const statusService = new StatusService();
const NotFoundError = require("../exceptions/NotFoundError");
const InvariantError = require("../exceptions/InvariantError");


// ─────────────────────────────
// 🔹 Tambahkan paket ke batch (via kapal/pesawat)
// ─────────────────────────────
async function insertBatchPackages(batchId, packageIds, via) {
  if (!packageIds || packageIds.length === 0) return;

  await db.transaction(async (trx) => {
    const rows = packageIds.map((pkgId) => ({
      id_batch: batchId,
      package_id: pkgId,
      via,
    }));

    await trx("batch_packages").insert(rows);

    // Update total batch
    const packages = await trx("packages").whereIn("id", packageIds);
    const { totalWeight, totalValue } = calculateBatchDetails(packages);

    const batchTable =
      via === "Kapal" ? "batches_kapal" : "batches_pesawat";

    await trx(batchTable)
      .where("id", batchId)
      .update({ total_berat: totalWeight, total_value: totalValue });
  });

  // Status ditambahkan setelah transaksi commit
  for (const pkgId of packageIds) {
    await statusService.addStatus(pkgId, 2, batchId);
  }
}


// ─────────────────────────────
// 🔹 Tambahkan paket (Pesawat)
// ─────────────────────────────
async function addPackageToBatch(batchId, resi, via = "Pesawat") {
  let packageId = null;

  await db.transaction(async (trx) => {
    const pkg = await trx("packages").where({ resi }).first();
    if (!pkg) throw new NotFoundError(`Paket ${resi} tidak ditemukan`);
    packageId = pkg.id;

    const exists = await trx("batch_packages")
      .where({ id_batch: batchId, package_id: pkg.id })
      .first();
    if (exists)
      throw new InvariantError(`Paket ${resi} sudah ada di batch ini`);

    await trx("batch_packages").insert({
      id_batch: batchId,
      package_id: pkg.id,
      via,
    });

    const packagesInBatch = await trx("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", batchId)
      .select("p.berat_dipakai", "p.harga");

    const { totalWeight, totalValue } = calculateBatchDetails(packagesInBatch);
    await trx("batches_pesawat")
      .where("id", batchId)
      .update({ total_berat: totalWeight, total_value: totalValue });
  });

  await statusService.addStatus(packageId, 2, batchId);
  return { success: true, message: `Paket ${resi} berhasil ditambahkan ke batch pesawat` };
}


// ─────────────────────────────
// 🔹 Tambah karung ke batch kapal
// ─────────────────────────────
async function addKarungToBatch(batchId, noKarung) {
  let result;

  await db.transaction(async (trx) => {
    const batch = await trx("batches_kapal").where({ id: batchId }).first();
    if (!batch) throw new NotFoundError("Batch tidak ditemukan");

    const exists = await trx("karung")
      .where({ id_batch: batchId, no_karung: noKarung })
      .first();
    if (exists) throw new InvariantError("Nomor karung sudah ada di batch ini");

    const [inserted] = await trx("karung")
      .insert({ id_batch: batchId, no_karung: noKarung })
      .returning("*");

    result = inserted;
  });

  return result;
}


// ─────────────────────────────
// 🔹 Tambahkan paket ke karung
// ─────────────────────────────
async function addPackageToKarung(batchId, resi, noKarung) {
  let paketId = null;

  await db.transaction(async (trx) => {
    const paket = await trx("packages").where({ resi }).first();
    if (!paket) throw new NotFoundError("Paket tidak ditemukan");
    paketId = paket.id;

    const karung = await trx("karung")
      .where({ id_batch: batchId, no_karung: noKarung })
      .first();
    if (!karung) throw new NotFoundError("Karung tidak ditemukan di batch ini");

    const existKarung = await trx("package_karung")
      .where({ package_id: paket.id })
      .first();
    if (existKarung) throw new InvariantError("Paket sudah ada di karung lain");

    const existsInBatch = await trx("batch_packages")
      .where({ id_batch: batchId, package_id: paket.id })
      .first();

    if (!existsInBatch) {
      await trx("batch_packages").insert({
        id_batch: batchId,
        package_id: paket.id,
        via: "Kapal",
        no_karung: noKarung,
      });

      const packagesInBatch = await trx("batch_packages as bp")
        .join("packages as p", "bp.package_id", "p.id")
        .where("bp.id_batch", batchId)
        .select("p.berat_dipakai", "p.harga");

      const { totalWeight, totalValue } = calculateBatchDetails(packagesInBatch);
      await trx("batches_kapal")
        .where("id", batchId)
        .update({ total_berat: totalWeight, total_value: totalValue });
    }

    await trx("package_karung").insert({
      karung_id: karung.id,
      package_id: paket.id,
    });
  });

  await statusService.addStatus(paketId, 2, batchId);
  return { success: true, message: `Paket ${resi} berhasil masuk ke karung ${noKarung}` };
}


// ─────────────────────────────
// 🔹 Buat batch kapal
// ─────────────────────────────
async function createBatchKapal(packageIds, namaKapal, tanggalClosing, tanggalBerangkat, vendor, userId) {
  let result;

  await db.transaction(async (trx) => {
    const batchId = generateIdBatchesKapal();

    const packages = packageIds?.length
      ? await trx("packages").whereIn("id", packageIds)
      : [];

    const { totalWeight, totalValue } = calculateBatchDetails(packages);

    await trx("batches_kapal").insert({
      id: batchId,
      nama_kapal: namaKapal,
      tanggal_closing: tanggalClosing,
      tanggal_berangkat: tanggalBerangkat,
      via: "Kapal",
      vendor,
      total_berat: totalWeight,
      total_value: totalValue,
      created_by: userId,
      updated_by: userId,
    });

    if (packageIds?.length) {
      const rows = packageIds.map((pkgId) => ({
        id_batch: batchId,
        package_id: pkgId,
        via: "Kapal",
      }));
      await trx("batch_packages").insert(rows);
    }

    result = { batchId, totalWeight, totalValue };
  });

  // tambahkan status setelah commit
  if (packageIds?.length) {
    for (const pkgId of packageIds) {
      await statusService.addStatus(pkgId, 2);
    }
  }

  return result;
}


// ─────────────────────────────
// 🔹 Buat batch pesawat
// ─────────────────────────────
async function createBatchPesawat(packageIds, namaPIC, tanggalKirim, vendor, userId) {
  let result;

  await db.transaction(async (trx) => {
    const batchId = generateIdBatchesPesawat();

    const packages = packageIds?.length
      ? await trx("packages").whereIn("id", packageIds)
      : [];

    const { totalWeight, totalValue } = calculateBatchDetails(packages);

    await trx("batches_pesawat").insert({
      id: batchId,
      pic: namaPIC,
      tanggal_kirim: tanggalKirim,
      via: "Pesawat",
      vendor,
      total_berat: totalWeight,
      total_value: totalValue,
      created_by: userId,
      updated_by: userId,
    });

    if (packageIds?.length) {
      const rows = packageIds.map((pkgId) => ({
        id_batch: batchId,
        package_id: pkgId,
        via: "Pesawat",
      }));
      await trx("batch_packages").insert(rows);
    }

    result = { batchId, totalWeight, totalValue };
  });

  if (packageIds?.length) {
    for (const pkgId of packageIds) {
      await statusService.addStatus(pkgId, 2);
    }
  }

  return result;
}


// ─────────────────────────────
// 🔹 Fungsi get (tidak perlu trx karena read-only)
// ─────────────────────────────
async function getAllBatchesKapal() {
  return db("batches_kapal").orderBy("tanggal_berangkat", "desc");
}

async function getAllBatchesPesawat() {
  return db("batches_pesawat").orderBy("tanggal_kirim", "desc");
}

async function getBatchKapalWithPackages(batchId) {
  const batch = await db("batches_kapal").where("id", batchId).first();
  if (!batch) return null;

  const packages = await db("batch_packages as bp")
    .join("packages as p", "bp.package_id", "p.id")
    .where("bp.id_batch", batchId)
    .select("p.id as package_id", "p.nama", "p.resi", "p.berat_dipakai", "p.harga");

  return { ...batch, packages };
}

async function getBatchPesawatWithPackages(batchId) {
  const batch = await db("batches_pesawat").where("id", batchId).first();
  if (!batch) return null;

  const packages = await db("batch_packages as bp")
    .join("packages as p", "bp.package_id", "p.id")
    .where("bp.id_batch", batchId)
    .select("p.id as package_id", "p.nama", "p.resi", "p.berat_dipakai", "p.harga");

  return { ...batch, packages };
}


// ─────────────────────────────
// 🔹 Export
// ─────────────────────────────
module.exports = {
  insertBatchPackages,
  addPackageToBatch,
  createBatchKapal,
  createBatchPesawat,
  addKarungToBatch,
  addPackageToKarung,
  getAllBatchesKapal,
  getAllBatchesPesawat,
  getBatchKapalWithPackages,
  getBatchPesawatWithPackages,
};