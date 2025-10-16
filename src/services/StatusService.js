const db = require("../db");

class StatusService {
  async addStatus(packageId, status, batchId = null) {
    let pkg = null;
    if (packageId !== null && packageId !== undefined) {
      pkg = await db("packages").where({ id: packageId }).first();
      if (!pkg) throw new Error("Paket tidak ditemukan");

      if (pkg.invoiced === true) {
        const now = new Date();
        await db("package_status")
          .insert({
            package_id: packageId,
            status: 5,
            created_at: now,
          })
          .onConflict("package_id")
          .merge({
            status: 5,
            created_at: now,
          });
        return;
      }
    }

    if (status === 1) {
      if (!packageId) throw new Error("packageId harus diberikan untuk status 1");
      const now = new Date();
      await db("package_status")
        .insert({
          package_id: packageId,
          status: 1,
          created_at: now,
        })
        .onConflict("package_id")
        .merge({
          status: 1,
          created_at: now,
        });

    } else if (status === 2) {
      if (!packageId) throw new Error("packageId harus diberikan untuk status 2");
      if (!batchId) throw new Error("batchId harus diberikan untuk status 2");

      const batchPackage = await db("batch_packages")
        .where({ package_id: packageId, id_batch: batchId })
        .first();

      if (!batchPackage) {
        throw new Error("Paket tidak ditemukan di batch ini");
      }

      const now = new Date();
      await db("package_status")
        .insert({
          package_id: packageId,
          status: 2,
          created_at: now,
        })
        .onConflict("package_id")
        .merge({
          status: 2,
          created_at: now,
        });

    } else if (status === 3 || status === 4) {
      if (!batchId) throw new Error(`batchId harus diberikan untuk status ${status}`);

      const batchPackages = await db("batch_packages")
        .where({ id_batch: batchId })
        .select("package_id");

      if (!batchPackages || batchPackages.length === 0) {
        throw new Error("Tidak ada paket dalam batch ini");
      }

      const now = new Date();
      const inserts = batchPackages.map((bp) => ({
        package_id: bp.package_id,
        status,
        created_at: now,
      }));

      await db("package_status")
        .insert(inserts)
        .onConflict("package_id")
        .merge({
          status,
          created_at: now,
        });

    } else if (status === 5) {
      if (!packageId) throw new Error("packageId harus diberikan untuk status 5");

      const now = new Date();
      await db("package_status")
        .insert({
          package_id: packageId,
          status: 5,
          created_at: now,
        })
        .onConflict("package_id")
        .merge({
          status: 5,
          created_at: now,
        });

    } else {
      throw new Error("Status tidak valid");
    }
  }

  async getLatestStatus(packageId) {
    const latest = await db("package_status as ps")
      .join("active_packages", "ps.package_id", "active_packages.package_id")
      .select("ps.status", "ps.created_at")
      .where("ps.package_id", packageId)
      .orderBy("ps.created_at", "desc")
      .first();

    return latest || null;
  }
}

module.exports = StatusService;