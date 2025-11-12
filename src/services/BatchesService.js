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
    // 🔹 Cek apakah paket dengan resi tersebut ada
    const pkg = await trx("packages").where({ resi }).first();
    if (!pkg) throw new NotFoundError(`Paket ${resi} tidak ditemukan`);
    packageId = pkg.id;

    // 🔹 Cek apakah paket sudah ada di batch manapun
    const existingBatch = await trx("batch_packages")
      .where({ package_id: pkg.id })
      .first();

    if (existingBatch) {
      if (existingBatch.id_batch === batchId) {
        // Jika paket sudah ada di batch ini -> tolak
        throw new InvariantError(`Paket ${resi} sudah ada di batch ini`);
      } else {
        // Jika paket ada di batch lain -> hapus dari batch lama
        await trx("batch_packages")
          .where({ package_id: pkg.id })
          .delete();

        // Opsional: update total berat & nilai di batch lama
        const oldPackages = await trx("batch_packages as bp")
          .join("packages as p", "bp.package_id", "p.id")
          .where("bp.id_batch", existingBatch.id_batch)
          .select("p.berat_dipakai", "p.harga");

        const { totalWeight: oldWeight, totalValue: oldValue } = calculateBatchDetails(oldPackages);
        await trx("batches_pesawat")
          .where("id", existingBatch.id_batch)
          .update({ total_berat: oldWeight, total_value: oldValue });
      }
    }

    // 🔹 Tambahkan paket ke batch baru
    await trx("batch_packages").insert({
      id_batch: batchId,
      package_id: pkg.id,
      via,
    });

    // 🔹 Hitung ulang total berat & nilai di batch ini
    const packagesInBatch = await trx("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", batchId)
      .select("p.berat_dipakai", "p.harga");

    const { totalWeight, totalValue } = calculateBatchDetails(packagesInBatch);
    await trx("batches_pesawat")
      .where("id", batchId)
      .update({ total_berat: totalWeight, total_value: totalValue });
  });

  // 🔹 Tambahkan status paket ke status 2 (masuk batch pesawat)
  await statusService.addStatus(packageId, 2, batchId);

  return {
    success: true,
    message: `Paket ${resi} berhasil dipindahkan atau ditambahkan ke batch pesawat.`,
  };
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
  return await db.transaction(async (trx) => {
    // Ambil batch kapal
    const batch = await trx("batches_kapal")
      .where("id", batchId)
      .first();

    if (!batch) return null;

    // Ambil semua package yang terkait batch
    const packages = await trx("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", batchId)
      .select(
        "p.id as package_id",
        "p.nama",
        "p.resi",
        "p.berat_dipakai",
        "p.harga",
        "p.invoiced",
        "p.tanggal_tiba",
        "p.kode",
        "p.panjang",
        "p.lebar",
        "p.tinggi"
      );

    // Gabungkan hasil
    return { ...batch, packages };
  });
}

async function getBatchPesawatWithPackages(batchId) {
  const batch = await db("batches_pesawat").where("id", batchId).first();
  if (!batch) return null;

  const packages = await db("batch_packages as bp")
    .join("packages as p", "bp.package_id", "p.id")
    .where("bp.id_batch", batchId)
    .select("p.id as package_id", "p.nama", "p.resi", "p.berat_dipakai", "p.harga")

  return { ...batch, packages };
}


// 🔹 Ambil batch kapal dengan daftar karung & paket di dalamnya
async function getBatchWithKarung(batchId) {
  const batch = await db("batches_kapal").where("id", batchId).first();
  if (!batch) throw new NotFoundError("Batch tidak ditemukan");

  // Ambil semua karung di batch ini
  const karungList = await db("karung").where("id_batch", batchId);

  // Untuk setiap karung, ambil paketnya
  const karungWithPackages = await Promise.all(
    karungList.map(async (karung) => {
      const packages = await db("package_karung as pk")
        .join("packages as p", "pk.package_id", "p.id")
        .where("pk.karung_id", karung.id)
        .select("p.id", "p.nama", "p.resi", "p.berat_dipakai", "p.harga");
      return { ...karung, packages };
    })
  );

  return { ...batch, karung: karungWithPackages };
}

// 🔹 Ambil paket berdasarkan no karung
// 🔹 Ambil paket berdasarkan no karung
async function getPackagesByKarung(batchId, noKarung, searchQuery = "") {
  const karung = await db("karung")
    .where({ id_batch: batchId, no_karung: noKarung })
    .first();

  if (!karung) throw new NotFoundError("Karung tidak ditemukan di batch ini");

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

// ─────────────────────────────
// 🔹 Pindahkan / Set ulang paket ke karung tertentu
// ─────────────────────────────
async function movePackageToKarung(batchId, resi, noKarungBaru) {
  let paketId = null;

  await db.transaction(async (trx) => {
    // ✅ Cek paket
    const paket = await trx("packages").where({ resi }).first();
    if (!paket) throw new NotFoundError("Paket tidak ditemukan");
    paketId = paket.id;

    // ✅ Cek karung baru valid
    const karungBaru = await trx("karung")
      .where({ id_batch: batchId, no_karung: noKarungBaru })
      .first();
    if (!karungBaru) throw new NotFoundError("Karung tujuan tidak ditemukan di batch ini");

    // ✅ Cek apakah paket sudah ada di karung manapun
    const karungLama = await trx("package_karung")
      .where({ package_id: paket.id })
      .first();

    // ✅ Jika paket ada di karung lama → hapus dulu
    if (karungLama) {
      await trx("package_karung")
        .where({ package_id: paket.id })
        .delete();
    }

    // ✅ Insert ke karung baru
    await trx("package_karung").insert({
      karung_id: karungBaru.id,
      package_id: paket.id,
    });

    // ✅ Pastikan paket tercatat di batch_packages juga
    const existsInBatch = await trx("batch_packages")
      .where({ id_batch: batchId, package_id: paket.id })
      .first();

    if (!existsInBatch) {
      await trx("batch_packages").insert({
        id_batch: batchId,
        package_id: paket.id,
        via: "Kapal",
        no_karung: noKarungBaru,
      });
    } else {
      await trx("batch_packages")
        .where({ id_batch: batchId, package_id: paket.id })
        .update({ no_karung: noKarungBaru });
    }

    // ✅ Update total batch
    const packagesInBatch = await trx("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", batchId)
      .select("p.berat_dipakai", "p.harga");

    const { totalWeight, totalValue } = calculateBatchDetails(packagesInBatch);
    await trx("batches_kapal")
      .where("id", batchId)
      .update({ total_berat: totalWeight, total_value: totalValue });
  });

  // ✅ Tambahkan status (setelah commit)
  await statusService.addStatus(paketId, 2, batchId);

  return {
    success: true,
    message: `Paket ${resi} berhasil dipindahkan ke karung ${noKarungBaru}`,
  };
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
  getBatchWithKarung,
  getPackagesByKarung,
  movePackageToKarung,
};