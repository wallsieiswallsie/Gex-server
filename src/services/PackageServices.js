const db = require("../db");
const InvariantError = require("../exceptions/InvariantError");
const NotFoundError = require("../exceptions/NotFoundError");
const { calculatePackageDetails } = require("../utils/calculations");
const StatusService = require("./StatusService");
const service = new StatusService();
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const credentials = JSON.parse(process.env.GCLOUD_CREDENTIALS);
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials,
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

async function uploadToGCS(buffer, filename, mimetype) {
  if (!buffer || buffer.length === 0) {
    throw new Error("File buffer kosong, tidak bisa upload");
  }

  console.log(`[GCS] Start uploading file: ${filename}, size: ${buffer.length} bytes`);

  const blob = bucket.file(filename);

  await blob.save(buffer, {
    contentType: mimetype || "application/octet-stream",
    resumable: false,
    metadata: {
      // metadata optional
      uploadedBy: "package-service",
    },
  });

  // Public URL permanen
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

  console.log("[GCS] Public URL:", publicUrl);
  return publicUrl;
}

class PackageServices {
  async createPackage(data) {
    const trx = await db.transaction();

    try {
      const details = calculatePackageDetails(data);

      // simpan package dulu tanpa foto
      const [newPackage] = await trx("packages")
        .insert({
          nama: data.nama || "",
          resi: data.resi || "",
          tanggal_tiba: data.tanggal_tiba || null, 
          ekspedisi: data.ekspedisi || null,
          panjang: Number(data.panjang) || 0,
          lebar: Number(data.lebar) || 0,
          tinggi: Number(data.tinggi) || 0,
          berat: Number(data.berat) || 0,
          kode: data.kode || "",
          harga: details.price,
          via: details.via,
          berat_dipakai: details.weightUsed,
          invoiced: false,
          created_at: new Date(),
          updated_at: new Date(),
          photo_url: null,
          
        })
        .returning("*");

      // Upload foto jika ada
      if (data.photo) {
        const uniqueFilename = `${newPackage.id}-${Date.now()}-${data.photo.name || "file"}`;
        const publicUrl = await uploadToGCS(
          data.photo._data || data.photo,
          uniqueFilename,
          data.photo.type || "image/jpeg"
        );

        await trx("packages")
          .where({ id: newPackage.id })
          .update({ photo_url: publicUrl });

        newPackage.photo_url = publicUrl;
      }

      // Tambah status & active_packages
      await service.addStatus(newPackage.id, 1, null, trx);
      await this.addActivePackages({ packageId: newPackage.id }, trx);

      await trx.commit();
      return newPackage;

    } catch (err) {
      await trx.rollback();
      console.error("Error createPackage:", err);
      throw err;
    }
  }

  async getAllPackages({ filter, sortBy, sortOrder, userCabang }) {
  try {
    let query = db("packages")
      .join("active_packages", "packages.id", "active_packages.package_id")
      .leftJoin("invoice_packages", "packages.id", "invoice_packages.package_id")
      .leftJoin("invoices", "invoice_packages.invoice_id", "invoices.id")
      .leftJoin("package_status as ps", "packages.id", "ps.package_id")
      .select(
        "packages.*",
        "active_packages.id as active_id",
        "invoice_packages.invoice_id",
        "invoices.total_price as invoice_total",
        "ps.status",
        "ps.created_at as status_created_at"
      );

    if (filter) {
      const lowerFilter = `%${filter.toLowerCase()}%`;
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(nama) LIKE ?", [lowerFilter])
          .orWhereRaw("LOWER(kode) LIKE ?", [lowerFilter])
          .orWhereRaw("LOWER(resi) LIKE ?", [lowerFilter]);
      });
    }

    if (userCabang) {
      const allowedKodeForUser = [];

      if (["remu", "main"].includes(userCabang)) {
        allowedKodeForUser.push("JKSOQA", "JPSOQA");
      }
      if (["aimas", "main"].includes(userCabang)) {
        allowedKodeForUser.push("JKSOQB", "JPSOQB");
      }

      query = query.whereIn("packages.kode", allowedKodeForUser);
    }

    if (sortBy) {
      query = query.orderBy(sortBy, sortOrder || "asc");
    } else {
      query = query.orderBy("packages.created_at", "desc");
    }

    const packages = await query;
    return packages;
  } catch (err) {
    console.error("Error fetching packages:", err);
    throw err;
  }
}

  async getAllArchivePackages({ filter, sortBy, sortOrder }) {
    try {
      let query = db("packages")
        .join("archive_packages", "packages.id", "archive_packages.package_id")
        .leftJoin("invoice_packages", "packages.id", "invoice_packages.package_id")
        .leftJoin("invoices", "invoice_packages.invoice_id", "invoices.id")
        .leftJoin(
          db.raw(`
            (
              SELECT DISTINCT ON (package_id)
                package_id, status, created_at
              FROM package_status
              ORDER BY package_id, created_at DESC
            ) as ps
          `),
          "packages.id",
          "ps.package_id"
        )
        .select(
          "packages.*",
          "archive_packages.id as archive_id",
          "invoice_packages.invoice_id",
          "invoices.total_price as invoice_total",
          "ps.status",
          "ps.created_at as status_created_at"
        );

      if (filter) {
        const lowerFilter = `%${filter.toLowerCase()}%`;
        query = query.where((builder) => {
          builder
            .whereRaw("LOWER(nama) LIKE ?", [lowerFilter])
            .orWhereRaw("LOWER(kode) LIKE ?", [lowerFilter])
            .orWhereRaw("LOWER(resi) LIKE ?", [lowerFilter]);
        });
      }

      if (sortBy) {
        query = query.orderBy(sortBy, sortOrder || "asc");
      } else {
        query = query.orderBy("packages.created_at", "desc");
      }

      const packages = await query;
      return packages;
    } catch (err) {
      console.error("Error fetching packages:", err);
      throw err;
    }
  }

  async addActivePackages({ packageId }, trx = null) {
    const t = trx || db;

    const packages = await t("packages").where({ id: packageId }).first();
    if (!packages) throw new NotFoundError("Paket tidak ditemukan!");

    const [result] = await t("active_packages")
      .insert({ package_id: packageId })
      .returning("*");

    if (!result) throw new InvariantError("Paket gagal diinput");
    return result;
  }

  async addArchivePackages({ trx, packageId }) {
    const pkg = await trx("packages")
      .where({ id: packageId })
      .first();

    if (!pkg) {
      throw new NotFoundError("Paket tidak ditemukan!");
    }

    const exists = await trx("archive_packages")
      .where({ package_id: packageId })
      .first();

    if (exists) {
      throw new InvariantError("Paket sudah ada di arsip!");
    }

    const [inserted] = await trx("archive_packages")
      .insert({
        package_id: packageId,
      })
      .returning("*");

    if (!inserted) {
      throw new InvariantError("Paket gagal diarsipkan");
    }

    const result = await trx("archive_packages")
      .join("packages", "archive_packages.package_id", "packages.id")
      .leftJoin("invoice_packages", "packages.id", "invoice_packages.package_id")
      .select(
        "archive_packages.id as archive_id",
        "packages.*",
        "invoice_packages.invoice_id"
      )
      .where("archive_packages.id", inserted.id)
      .first();

    return result;
  }


  async getPackages({ filter, sortBy = "created_at", sortOrder = "desc", page = 1, limit = 50 }) {
    let query = db("packages")
      .leftJoin("invoice_packages", "packages.id", "invoice_packages.package_id")
      .leftJoin("invoices", "invoice_packages.invoice_id", "invoices.id")
      .select(
        "packages.*",
        "invoice_packages.invoice_id",
        "invoices.total_price as invoice_total"
      );

    if (filter) {
      const lowerFilter = `%${filter.toLowerCase()}%`;
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(nama) LIKE ?", [lowerFilter])
          .orWhereRaw("LOWER(resi) LIKE ?", [lowerFilter]);
      });
    }

    const validSortFields = ["nama", "resi", "created_at", "harga"];
    const validSortOrders = ["asc", "desc"];
    if (!validSortFields.includes(sortBy)) sortBy = "created_at";
    if (!validSortOrders.includes(sortOrder)) sortOrder = "desc";

    query = query.orderBy(sortBy, sortOrder);


    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const packages = await query;
    return packages;
  }

  async countPackages({ filter }) {
    let query = db("packages").count("id as total");
    if (filter) {
      const lowerFilter = `%${filter.toLowerCase()}%`;
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(nama) LIKE ?", [lowerFilter])
          .orWhereRaw("LOWER(resi) LIKE ?", [lowerFilter]);
      });
    }
    const [{ total }] = await query;
    return Number(total);
  }

  async removeActivePackageById({ packageId, trx }) {
    return await db.transaction(async (transaction) => {
      const t = trx || transaction;

      const pkg = await t("packages").where({ id: packageId }).first();
      if (!pkg) throw new NotFoundError("Paket tidak ditemukan");

      const relation = await t("active_packages")
        .where({ package_id: packageId })
        .first();

      if (!relation) throw new NotFoundError("Paket tidak ada di active_package");

      // 🔹 Pindahkan ke archive_packages
      await this.addArchivePackages({ trx: t, packageId });

      // 🔹 Hapus dari active_packages
      await t("active_packages")
        .where("id", relation.id)
        .andWhere("package_id", packageId)
        .del();

      // 🔹 Tambahkan status 8 (selesai)
      const statusService = new StatusService();
      await statusService.addStatus(packageId, 8, null, t);

      // 🔹 Commit transaksi otomatis oleh db.transaction
    });
  }

  async confirmPackageService({ resi, kode, nama }) {
    return await db.transaction(async (t) => {
      
      // 1. Cari paket berdasarkan RESI
      const paket = await t("packages").where({ resi }).first();

      if (!paket) {
        throw new NotFoundError("Resi tidak ditemukan di database.");
      }

      // 2. Validasi bahwa paket memang status Bermasalah
      if (paket.kode !== "Bermasalah") {
        throw new InvariantError("Paket tidak ada dalam daftar paket bermasalah.");
      }

      // 3. Tentukan VIA berdasarkan kode baru dari client
      let viaUpdate = paket.via;

      if (kode === "JKSOQA" || kode === "JKSOQB") {
        viaUpdate = "Kapal";
      } else if (kode === "JPSOQA" || kode === "JPSOQB") {
        viaUpdate = "Pesawat";
      } else if (kode === "Bermasalah") {
        viaUpdate = "Bermasalah";
      }

      // 4. Kalkulasi berat_dipakai & harga
      const calculated = calculatePackageDetails({
        ...paket,
        kode: kode, // kode baru dari client
      });

      const { weightUsed, price } = calculated;

      // 5. Update tabel packages
      await t("packages")
        .where({ id: paket.id })
        .update({
          kode,
          via: viaUpdate,
          nama,

          berat_dipakai: weightUsed,
          harga: price,

          updated_at: new Date(),
        });

      // 6. Tambah ke confirmed_packages
      await t("confirmed_packages")
        .insert({
          package_id: paket.id,
        })
        .returning("*");

      return {
        success: true,
        message: "Paket telah berhasil dikonfirmasi.",
        detail: {
          weightUsed,
          price,
          via: viaUpdate,
        },
      };
    });
  }

  async getUnmovedConfirmedPackagesService() {
    try {
      const data = await db("confirmed_packages AS cp")
        .join("packages AS p", "cp.package_id", "p.id")
        .select(
          "cp.id AS id",            
          "cp.package_id AS package_id",
          "cp.is_moved AS is_moved",
          "p.nama AS nama",
          "p.resi AS resi",
          "p.kode AS kode"
        )
        .where("cp.is_moved", false)
        .orderBy("cp.id", "asc");

      return {
        success: true,
        count: data.length,
        data,
      };
    } catch (err) {
      throw new InvariantError("Gagal mengambil data paket yang belum dipindahkan.");
    }
  }

  async markConfirmedPackageAsMovedService({ resi }) {
    return await db.transaction(async (trx) => {

      // 1. Cari paket berdasarkan kolom resi
      const paket = await trx("packages")
        .select("id", "resi")
        .where({ resi })
        .first();

      if (!paket) {
        throw new InvariantError("Paket dengan resi tersebut tidak ditemukan.");
      }

      const packageId = paket.id;

      // 2. Cari record di confirmed_packages berdasarkan package_id
      const confirmed = await trx("confirmed_packages")
        .select("id")
        .where({ package_id: packageId })
        .first();

      if (!confirmed) {
        throw new InvariantError("Paket belum pernah dikonfirmasi.");
      }

      // 3. Update is_moved menjadi true
      await trx("confirmed_packages")
        .where({ package_id: packageId })
        .update({
          is_moved: true,
        });

      return {
        success: true,
        message: "Paket berhasil ditandai sebagai sudah dipindahkan.",
        package_id: packageId,
      };
    });
  }

  async updatePackageService(input) {
    const trx = await db.transaction();

    try {
      const {
        panjang,
        lebar,
        tinggi,
        berat,
        kode,
        nama,
        resi,
        ekspedisi,
      } = input;

      // ────────────────────────────────────────────
      // 1. Ambil package berdasarkan RESI
      // ────────────────────────────────────────────
      const paket = await trx("packages")
        .where({ resi })
        .first();

      if (!paket) {
        throw new NotFoundError("Package tidak ditemukan");
      }

      const packageId = paket.id;
      const hargaLama = Number(paket.harga || 0);
      const beratDipakaiLama = Number(paket.berat_dipakai || 0);

      let invoiceInfo = null;
      let batchInfo = null;

      // ────────────────────────────────────────────
      // 2. Jika invoiced = true → ambil invoice terkait
      // ────────────────────────────────────────────
      if (paket.invoiced) {
        invoiceInfo = await trx("invoice_packages as ip")
          .join("invoices as i", "ip.invoice_id", "i.id")
          .select("i.id as invoice_id", "i.total_price")
          .where("ip.package_id", packageId)
          .first();

        if (invoiceInfo) {
          // kurangi harga lama sebagai penyesuaian awal
          invoiceInfo.total_price = Number(invoiceInfo.total_price) - hargaLama;
        }
      }

      // ────────────────────────────────────────────
      // 3. Cek apakah package terdaftar di batch
      // ────────────────────────────────────────────
      const batchRelation = await trx("batch_packages")
        .where({ package_id: packageId })
        .first();

      if (batchRelation) {
        const batchTable =
          batchRelation.via === "Kapal"
            ? "batches_kapal"
            : "batches_pesawat";

        const existingBatch = await trx(batchTable)
          .where({ id: batchRelation.id_batch })
          .first();

        batchInfo = {
          table: batchTable,
          id: existingBatch.id,
          total_value: Number(existingBatch.total_value) - hargaLama,
          total_berat: Number(existingBatch.total_berat) - beratDipakaiLama,
        };
      }

      // ────────────────────────────────────────────
      // 4. Hitung nilai baru berdasarkan input client
      // ────────────────────────────────────────────
      const details = calculatePackageDetails({
        panjang,
        lebar,
        tinggi,
        berat,
        kode,
      });

      const hargaBaru = details.price;
      const beratDipakaiBaru = details.weightUsed;

      // ────────────────────────────────────────────
      // 5. Update tabel packages
      // ────────────────────────────────────────────
      await trx("packages")
        .where({ id: packageId })
        .update({
          panjang: Number(panjang) || 0,
          lebar: Number(lebar) || 0,
          tinggi: Number(tinggi) || 0,
          berat: Number(berat) || 0,

          harga: hargaBaru,
          berat_dipakai: beratDipakaiBaru,

          kode,
          via: details.via,
          nama,
          ekspedisi,

          updated_at: new Date(),
        });

      // ────────────────────────────────────────────
      // 6. Update invoice jika ada
      // ────────────────────────────────────────────
      if (invoiceInfo) {
        const finalPrice = invoiceInfo.total_price + hargaBaru;

        await trx("invoices")
          .where({ id: invoiceInfo.invoice_id })
          .update({
            total_price: finalPrice,
          });
      }

      // ────────────────────────────────────────────
      // 7. Update batch jika ada
      // ────────────────────────────────────────────
      if (batchInfo) {
        const finalValue = batchInfo.total_value + hargaBaru;
        const finalWeight = batchInfo.total_berat + beratDipakaiBaru;

        await trx(batchInfo.table)
          .where({ id: batchInfo.id })
          .update({
            total_value: finalValue,
            total_berat: finalWeight,
            updated_at: new Date(),
          });
      }

      await trx.commit();

      return {
        success: true,
        message: "Package berhasil diperbarui",
        data: {
          hargaBaru,
          beratDipakaiBaru,
          via: details.via,
        },
      };

    } catch (err) {
      await trx.rollback();
      console.error("Error in updatePackageService:", err);
      throw err;
    }
  }

};

module.exports = PackageServices;