const db = require("../db");

class FinanceService {
  
  async getTotalByBatchAndKode(idBatch, kode) {
    const result = await db("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", idBatch)
      .andWhere("p.kode", kode)
      .sum("p.harga as total_harga")
      .first();

    return result?.total_harga || 0;
  }

  async getTotalFinished(idBatch, kode) {
    const result = await db("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", idBatch)
      .andWhere("p.kode", kode)
      .andWhere("p.finished", true)
      .sum("p.harga as total_harga")
      .first();

    return result?.total_harga || 0;
  }

  async getTotalUnfinished(idBatch, kode) {
    const result = await db("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", idBatch)
      .andWhere("p.kode", kode)
      .andWhere("p.finished", false)
      .sum("p.harga as total_harga")
      .first();

    return result?.total_harga || 0;
  }

}

module.exports = FinanceService;
