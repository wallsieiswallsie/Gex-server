const db = require("../db");

class StatusService {
  async addStatus(packageId, status, batchId = null, trx = null) {
    const t = trx || db;

    if (!status || typeof status !== "number") {
      throw new Error("Status harus berupa angka");
    }

    let pkg = null;
    if (packageId) {
      pkg = await t("packages").where({ id: packageId }).first();
      if (!pkg) throw new Error("Paket tidak ditemukan");

      if (pkg.invoiced === true && status < 6) {
        const now = new Date();
        await t("package_status")
          .insert({ package_id: packageId, status: 5, created_at: now })
          .onConflict("package_id")
          .merge({ status: 5, created_at: now });
        return;
      }
    }

    const now = new Date();
    await t("package_status")
      .insert({ package_id: packageId, status, created_at: now })
      .onConflict("package_id")
      .merge({ status, created_at: now });

    switch (status) {
      case 1: {
        if (!packageId) throw new Error("packageId harus diberikan untuk status 1");
        await trx("package_status")
          .insert({ package_id: packageId, status, created_at: now })
          .onConflict("package_id")
          .merge({ status, created_at: now });
        break;
      }

      case 2: {
        if (!packageId) throw new Error("packageId harus diberikan untuk status 2");
        if (!batchId) throw new Error("batchId harus diberikan untuk status 2");

        const batchPackage = await trx("batch_packages")
          .where({ package_id: packageId, id_batch: batchId })
          .first();
        if (!batchPackage) {
          throw new Error("Paket tidak ditemukan di batch ini");
        }

        await trx("package_status")
          .insert({ package_id: packageId, status, created_at: now })
          .onConflict("package_id")
          .merge({ status, created_at: now });
        break;
      }

      case 3:
      case 4: {
        if (!batchId) throw new Error(`batchId harus diberikan untuk status ${status}`);
        const batchPackages = await trx("batch_packages")
          .where({ id_batch: batchId })
          .select("package_id");

        if (batchPackages.length === 0) {
          throw new Error("Tidak ada paket dalam batch ini");
        }

        const inserts = batchPackages.map((bp) => ({
          package_id: bp.package_id,
          status,
          created_at: now,
        }));

        await trx("package_status")
          .insert(inserts)
          .onConflict("package_id")
          .merge({ status, created_at: now });
        break;
      }

      case 5: {
        if (!packageId) throw new Error("packageId harus diberikan untuk status 5");
        await trx("package_status")
          .insert({ package_id: packageId, status, created_at: now })
          .onConflict("package_id")
          .merge({ status, created_at: now });
        break;
      }

      case 6: {
        if (!packageId) throw new Error("packageId harus diberikan untuk status 6");

        const delivery = await trx("deliveries").where({ package_id: packageId }).first();
        if (!delivery) {
          throw new Error("Paket belum ada di tabel deliveries, tidak bisa set status 6");
        }

        await trx("package_status")
          .insert({ package_id: packageId, status: 6, created_at: now })
          .onConflict("package_id")
          .merge({ status: 6, created_at: now });
        break;
      }

      case 7: {
        if (!packageId) {
          throw new Error("Resi atau packageId harus diberikan untuk status 7");
        }

        let targetPackageId = packageId;

        // 🔹 Jika yang dikirim adalah resi (string bukan angka)
        if (typeof packageId === "string" && isNaN(Number(packageId))) {
          const result = await trx("deliveries")
            .join("packages", "deliveries.package_id", "packages.id")
            .select("deliveries.package_id", "packages.resi")
            .where("packages.resi", packageId)
            .first();

          if (!result) {
            throw new Error(`Paket dengan resi ${packageId} tidak ditemukan di deliveries`);
          }

          targetPackageId = result.package_id;
        }

        // 🔹 Validasi bahwa paket sudah aktif di deliveries
        const delivery = await trx("deliveries").where({ package_id: targetPackageId }).first();
        if (!delivery) {
          throw new Error("Paket belum ada di tabel deliveries, tidak bisa set status 7");
        }

        if (delivery.active !== true) {
          throw new Error("Paket belum aktif di deliveries, tidak bisa set status 7");
        }

        // 🔹 Update status ke 7 di tabel package_status
        await trx("package_status")
          .insert({ package_id: targetPackageId, status: 7, created_at: now })
          .onConflict("package_id")
          .merge({ status: 7, created_at: now });

        break;
      }

      case 8: {
        if (!packageId) throw new Error("packageId harus diberikan untuk status 8");

        // Pastikan paket ada di tabel packages
        const pkg = await trx("packages").where({ id: packageId }).first();
        if (!pkg) {
          throw new Error("Paket tidak ditemukan di tabel packages");
        }

        // Update kolom finished = true
        await trx("packages").where({ id: packageId }).update({ finished: true });

        // Simpan status 8 di tabel package_status
        await trx("package_status")
          .insert({ package_id: packageId, status: 8, created_at: now })
          .onConflict("package_id")
          .merge({ status: 8, created_at: now });

        break;
      }

      default:
        throw new Error("Status tidak valid");
    }
  }

  async getLatestStatus(packageId) {
    if (!packageId) throw new Error("packageId harus diberikan");

    const latest = await db("package_status")
      .select("status", "created_at")
      .where({ package_id: packageId })
      .orderBy("created_at", "desc")
      .first();

    return latest || null;
  }
}

module.exports = StatusService;