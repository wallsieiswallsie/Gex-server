const db = require("../db");

class FinanceService {
  
  async getTotalByBatchAndKode(batchId, kode) {
    const result = await db("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", batchId)
      .andWhere("p.kode", kode)
      .sum("p.harga as total_harga")
      .first();

    return result?.total_harga || 0;
  }

  async getTotalFinished(batchId, kode) {
    const result = await db("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", batchId)
      .andWhere("p.kode", kode)
      .andWhere("p.finished", true)
      .sum("p.harga as total_harga")
      .first();

    return result?.total_harga || 0;
  }

  async getTotalUnfinished(batchId, kode) {
    const result = await db("batch_packages as bp")
      .join("packages as p", "bp.package_id", "p.id")
      .where("bp.id_batch", batchId)
      .andWhere("p.kode", kode)
      .andWhere("p.finished", false)
      .sum("p.harga as total_harga")
      .first();

    return result?.total_harga || 0;
  }

  async addPaymentMethod(invoiceIds, paymentMethod, trx = db) {
    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      throw new Error("invoiceIds harus berupa array yang tidak kosong");
    }

    // Cek apakah semua invoice ada
    const existing = await trx("invoices").whereIn("id", invoiceIds);
    if (existing.length === 0) {
      throw new Error("Tidak ada invoice dengan id tersebut!");
    }

    // Update semua invoice sekaligus
    const updated = await trx("invoices")
      .whereIn("id", invoiceIds)
      .update({ payment_method: paymentMethod })
      .returning("*");

    return updated;
  }

}

module.exports = FinanceService;
