const db = require("../db");
const InvariantError = require("../exceptions/InvariantError");
const NotFoundError = require("../exceptions/NotFoundError");
const { calculatePackageDetails } = require("../utils/calculations");
const StatusService = require("./StatusService");
const service = new StatusService();

class PackageServices {
  async createPackage(data) {
    try {
      
      const details = calculatePackageDetails(data);

      const [newPackage] = await db("packages")
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
        })
        .returning("*");

      await service.addStatus(newPackage.id, 1);
      await this.addActivePackages({ packageId: newPackage.id })

      return newPackage;

    } catch (err) {
      console.error("Error inserting package:", err);
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

  async addActivePackages ({ packageId }) {
    const packages = await db("packages")
    .where({ id: packageId })
    .first();

    if (!packages) throw new NotFoundError("Paket tidak ditemukan!");

    const [result] = await db("active_packages")
    .insert({
      package_id: packageId,
    })
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

      await this.addArchivePackages({ trx: t, packageId });

      await t("active_packages")
      .where("id", relation.id)
      .andWhere("package_id", packageId)
      .del();
    });
  }

};

module.exports = PackageServices;