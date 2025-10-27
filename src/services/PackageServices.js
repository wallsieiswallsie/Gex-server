const db = require("../db");
const InvariantError = require("../exceptions/InvariantError");
const NotFoundError = require("../exceptions/NotFoundError");
const { calculatePackageDetails } = require("../utils/calculations");
const StatusService = require("./StatusService");
const service = new StatusService();
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Setup GCS
const credentials = JSON.parse(process.env.GCLOUD_CREDENTIALS);
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials,
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

async function uploadToGCS(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: { contentType: mimetype },
    });

    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', async () => {
      try {
        await blob.makePublic(); // agar bisa diakses publik
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      } catch (err) {
        reject(err);
      }
    });

    blobStream.end(buffer);
  });
}

class PackageServices {
  async createPackage(data) {
    const trx = await db.transaction();

    try {
      const details = calculatePackageDetails(data);

      const [newPackage] = await trx("packages")
        .insert({
          nama: data.nama || "",
          resi: data.resi || "",
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
      let photoUrl = null;
      const file = data.photo;
      if (file && file.hapi && file._data) {
        const uniqueFilename = `${newPackage.id}-${Date.now()}-${file.hapi.filename}`;
        photoUrl = await uploadToGCS(file._data, uniqueFilename, file.hapi.headers['content-type']);
      }

      if (photoUrl) {
        await trx("packages").where({ id: newPackage.id }).update({ photo_url: photoUrl });
        newPackage.photo_url = photoUrl;
      }

      // Tambah status & active_packages pakai trx
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
    const t = trx || db; // pakai transaction jika ada

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

};

module.exports = PackageServices;