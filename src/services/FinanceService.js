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
  const invoice = await trx("invoices").where("id", invoiceIds).first();
  if (!invoice) {
    throw new Error(`Invoice id tidak ditemukan!`);
  }

  await trx("invoices")
    .where("id", invoiceIds)
    .update({
      payment_method: paymentMethod,
    });

  const updated = await trx("invoices").where("id", invoiceIds).first();
  return updated;
}

}

module.exports = FinanceService;
