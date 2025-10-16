// services/DeliveryService.js
const db = require("../db");
const StatusService = require("./StatusService");
const statusService = new StatusService();

class DeliveryService {
  async getInvoiceSummaryById(id) {
    return await db("invoices").where("id", id).first();
  }

  async addInvoiceToDelivery(invoiceId) {
    return await db.transaction(async (trx) => {
      const invoice = await trx("invoices").where("id", invoiceId).first();
      if (!invoice) return null;

      const packageRows = await trx("invoice_packages")
        .where("invoice_id", invoiceId)
        .select("package_id");

      const inserted = [];
      const skipped = [];

      for (const row of packageRows) {
        const pkgId = row.package_id;

        const exists = await trx("deliveries")
          .where({ invoice_id: invoiceId, package_id: pkgId })
          .first();

        if (exists) {
          skipped.push(pkgId);
          continue;
        }

        await trx("deliveries").insert({
          invoice_id: invoiceId,
          package_id: pkgId,
        });

        await statusService.addStatus(pkgId, 6, null, trx);

        inserted.push(pkgId);
        
      }

      return { invoice, inserted, skipped };
    });
  }

  async addPackageToPengantaranActive(resi) {
    return await db.transaction(async (trx) => {
      // Cari package berdasarkan resi
      const pkg = await trx("packages").where("resi", resi).first();
      if (!pkg) {
        throw new Error("Paket dengan resi tersebut tidak ditemukan");
      }

      // Cari record deliveries berdasarkan package_id
      const delivery = await trx("deliveries")
        .where({ package_id: pkg.id })
        .first();

      if (!delivery) {
        throw new Error("Delivery untuk paket ini tidak ditemukan");
      }

      // Update kolom active menjadi true
      await trx("deliveries")
        .where({ id: delivery.id })
        .update({ active: true });

      return {
        message: "Paket berhasil diaktifkan untuk pengantaran",
        deliveryId: delivery.id,
        packageId: pkg.id,
        invoiceId: delivery.invoice_id,
      };
    });
  }

  async addPackageToPengantaranArchive(resi) {
    return await db.transaction(async (trx) => {
      // Cari package berdasarkan resi
      const pkg = await trx("packages").where("resi", resi).first();
      if (!pkg) {
        throw new Error("Paket dengan resi tersebut tidak ditemukan");
      }

      // Cari record deliveries berdasarkan package_id
      const delivery = await trx("deliveries")
        .where({ package_id: pkg.id })
        .first();

      if (!delivery) {
        throw new Error("Delivery untuk paket ini tidak ditemukan");
      }

      // Update kolom active menjadi true
      await trx("deliveries")
        .where({ id: delivery.id })
        .update({ active: false, finished: true });

      return {
        message: "Paket berhasil diarsipkan",
        deliveryId: delivery.id,
        packageId: pkg.id,
        invoiceId: delivery.invoice_id,
      };
    });
  }

  async getAllDeliveries() {
  const rows = await db("deliveries")
    .join("invoices", "deliveries.invoice_id", "invoices.id")
    .where("deliveries.active", false)
    .andWhere("deliveries.finished", false)
    .select(
      "invoices.id",
      "invoices.nama_invoice",
      "invoices.total_price",
      "invoices.created_at"
    )
    .groupBy(
      "invoices.id",
      "invoices.nama_invoice",
      "invoices.total_price",
      "invoices.created_at"
    );

  return rows;
}

async getPengantaranActive() {
  return await db("deliveries")
    .join("packages", "deliveries.package_id", "packages.id")
    .join("invoices", "deliveries.invoice_id", "invoices.id")
    .where("deliveries.active", true)
    .groupBy("deliveries.invoice_id", "invoices.total_price", "invoices.created_at")
    .select(
      "deliveries.invoice_id",
      "invoices.total_price",
      db.raw("COUNT(deliveries.id) as total_packages")
    )
    .orderBy("invoices.created_at", "desc");
}

async getPengantaranArchive() {
  return await db("deliveries")
    .join("packages", "deliveries.package_id", "packages.id")
    .join("invoices", "deliveries.invoice_id", "invoices.id")
    .where("deliveries.active", false)
    .andWhere("deliveries.finished", true)
    .groupBy("deliveries.invoice_id", "invoices.total_price", "invoices.created_at")
    .select(
      "deliveries.invoice_id",
      "invoices.total_price",
      db.raw("COUNT(deliveries.id) as total_packages")
    )
    .orderBy("invoices.created_at", "desc");
}

}

module.exports = DeliveryService;