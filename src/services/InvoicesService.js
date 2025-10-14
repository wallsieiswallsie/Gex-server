const db = require("../db");
const { generateInvoiceId } = require("../utils/generateInvoice");
const InvariantError = require("../exceptions/InvariantError");
const NotFoundError = require("../exceptions/NotFoundError");
const StatusService = require("./StatusService");
const statusService = new StatusService();
const PackageServices = require("./PackageServices");
const packageService = new PackageServices();

class InvoicesService {
  // Membuat invoice baru
  async createInvoice(packageIds, namaInvoice) {
    // cek apakah ada paket yang sudah masuk invoice
    const alreadyInvoiced = await db("packages")
      .whereIn("id", packageIds)
      .andWhere("invoiced", true);

    if (alreadyInvoiced.length > 0) {
      throw new InvariantError("Beberapa paket sudah masuk invoice sebelumnya");
    }

    // ambil data paket
    const packages = await db("packages").whereIn("id", packageIds);
    if (packages.length === 0) {
      throw new NotFoundError("Paket tidak ditemukan");
    }

    // hitung total harga
    const totalPrice = packages.reduce((sum, p) => sum + Number(p.harga), 0);

    // buat invoice baru
    const invoiceId = generateInvoiceId();
    const [invoice] = await db("invoices")
      .insert({ id: invoiceId, total_price: totalPrice, nama_invoice: namaInvoice })
      .returning("*");

    // simpan relasi ke tabel invoice_packages
    const invoicePackages = packageIds.map((pid) => ({
      invoice_id: invoice.id,
      package_id: pid,
    }));
    await db("invoice_packages").insert(invoicePackages);

    // update invoiced flag
    await db("packages")
      .whereIn("id", packageIds)
      .update({ invoiced: true, updated_at: new Date() });

    // update status ke 5 untuk setiap paket
    for (const packageId of packageIds) {
      await statusService.addStatus(packageId, 5);
    }

    return { ...invoice, packages };
  }

  async getAllInvoices() {
    return db("invoices")
      .join("invoice_packages", "invoices.id", "invoice_packages.invoice_id")
      .join("active_packages", "invoice_packages.package_id", "active_packages.package_id")
      .distinct("invoices.*") // agar invoice tidak duplikasi jika ada >1 paket aktif
      .select("invoices.*")
      .orderBy("invoices.created_at", "desc");
  }

  async getArchivedInvoices() {
    // join invoice_packages → archive_packages → invoices
    const archivedInvoices = await db("invoices")
      .join("invoice_packages", "invoices.id", "invoice_packages.invoice_id")
      .join("archive_packages", "invoice_packages.package_id", "archive_packages.package_id")
      .distinct("invoices.id") // ambil invoice unik
      .select("invoices.id", "invoices.nama_invoice", "invoices.total_price", "invoices.created_at")
      .orderBy("invoices.created_at", "desc");

    return archivedInvoices;
  }

  // Ambil invoice berdasarkan ID
  async getInvoiceById(id) {
    const invoice = await db("invoices").where("id", id).first();
    if (!invoice) return null;

    const packages = await db("packages")
      .join("invoice_packages", "packages.id", "invoice_packages.package_id")
      .where("invoice_packages.invoice_id", id)
      .select("packages.*");

    return { ...invoice, packages };
  }

  async addPackagesByResiToExistingInvoice(invoiceId, resiList) {
    return await db.transaction(async (trx) => {
      // 1️⃣ Pastikan invoice ada
      const invoice = await trx("invoices").where("id", invoiceId).first();
      if (!invoice) throw new NotFoundError("Invoice tidak ditemukan");

      // 2️⃣ Ambil paket berdasarkan kolom resi
      const packages = await trx("packages").whereIn("resi", resiList);
      if (packages.length === 0) {
        throw new NotFoundError("Tidak ada paket ditemukan berdasarkan nomor resi");
      }

      const packageIds = packages.map((p) => p.id);

      // 3️⃣ Cek apakah ada paket yang sudah di-invoice-kan
      const alreadyInvoiced = packages.filter((p) => p.invoiced === true);
      if (alreadyInvoiced.length > 0) {
        const resiSudahMasuk = alreadyInvoiced.map((p) => p.resi).join(", ");
        throw new InvariantError(
          `Beberapa paket sudah masuk invoice sebelumnya: ${resiSudahMasuk}`
        );
      }

      // 4️⃣ Tambahkan ke tabel relasi invoice_packages
      const invoicePackages = packageIds.map((pid) => ({
        invoice_id: invoiceId,
        package_id: pid,
      }));
      await trx("invoice_packages").insert(invoicePackages);

      // 5️⃣ Update flag invoiced di tabel packages
      await trx("packages")
        .whereIn("id", packageIds)
        .update({ invoiced: true });

      // 6️⃣ Hitung ulang total harga invoice
      const allPackages = await trx("packages")
        .join("invoice_packages", "packages.id", "invoice_packages.package_id")
        .where("invoice_packages.invoice_id", invoiceId)
        .select("packages.harga");

      const newTotal = allPackages.reduce((sum, p) => sum + Number(p.harga), 0);

      await trx("invoices").where("id", invoiceId).update({
        total_price: newTotal,
      });

      // 7️⃣ Tambahkan status baru untuk setiap paket
      for (const pid of packageIds) {
        await statusService.addStatus(pid, 5);
      }

      return {
        message: "Paket berhasil ditambahkan ke invoice",
        invoice_id: invoiceId,
        added_resi: resiList,
        total_price: newTotal,
        addedPackages: packages,
      };
    });
  }

  async archivePackagesByInvoices(invoiceIds) {
    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      throw new InvariantError("Tidak ada invoice yang dipilih");
    }

    return await db.transaction(async (trx) => {
      const invoices = await trx("invoices").whereIn("id", invoiceIds);
      if (invoices.length === 0) {
        throw new NotFoundError("Invoice tidak ditemukan");
      }

      // Ambil semua package terkait invoice
      const packages = await trx("packages")
        .join("invoice_packages", "packages.id", "invoice_packages.package_id")
        .whereIn("invoice_packages.invoice_id", invoiceIds)
        .select("packages.id");

      const packageIds = packages.map((p) => p.id);

      if (packageIds.length === 0) {
        throw new NotFoundError("Tidak ada paket yang terkait dengan invoice ini");
      }

      // Proses arsip paket satu per satu mirip PackageServices
      for (const packageId of packageIds) {
        // Hapus dari active_packages dan tambahkan ke archive_packages
        await packageService.removeActivePackageById({ packageId, trx });
      }

      return {
        message: "Semua paket dari invoice yang dipilih telah diarsipkan",
        invoiceIds,
        archivedPackageIds: packageIds,
      };
    });
  }

  // Hapus paket dari invoice
  async removePackageFromInvoice(invoiceId, packageId) {
    return await db.transaction(async (trx) => {
      invoiceId = String(invoiceId);
      packageId = Number(packageId);

      const invoice = await trx("invoices").where("id", invoiceId).first();
      if (!invoice) throw new NotFoundError("Invoice tidak ditemukan");

      const relation = await trx("invoice_packages")
        .where({ invoice_id: invoiceId, package_id: packageId })
        .first();
      if (!relation) throw new NotFoundError("Paket tidak ada di invoice ini");

      await trx("invoice_packages")
        .where({ invoice_id: invoiceId, package_id: packageId })
        .del();

      await trx("packages")
        .where({ id: packageId })
        .update({ invoiced: false, updated_at: new Date() });

      const remainingPackages = await trx("packages")
        .join("invoice_packages", "packages.id", "invoice_packages.package_id")
        .where("invoice_packages.invoice_id", invoiceId)
        .select("packages.harga");

      const newTotal = remainingPackages.reduce((sum, p) => sum + Number(p.harga), 0);

      if (newTotal === 0 || remainingPackages.length === 0) {
        await trx("invoices").where({ id: invoiceId }).del();
        return {
          message: "Invoice kosong, telah dihapus",
          invoice_id: invoiceId,
          total_price: 0,
          invoice_deleted: true,
        };
      } else {
        await trx("invoices").where({ id: invoiceId }).update({ total_price: newTotal });
        return {
          message: "Paket berhasil dihapus dari invoice",
          invoice_id: invoiceId,
          total_price: newTotal,
          invoice_deleted: false,
        };
      }
  });
}


}

module.exports = InvoicesService;