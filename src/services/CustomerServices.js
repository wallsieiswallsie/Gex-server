const knex = require("../db");
const { Storage } = require("@google-cloud/storage");
require("dotenv").config();

// =================== GCS CONFIG ===================
const credentials = JSON.parse(process.env.GCLOUD_CREDENTIALS);
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials,
});
const bucket = storage.bucket(process.env.GCS_TUTORIAL_BUCKET);

async function uploadToGCS(buffer, filename, mimetype) {
  if (!buffer || buffer.length === 0) throw new Error("File buffer kosong");
  const blob = bucket.file(filename);
  await blob.save(buffer, {
    contentType: mimetype || "application/octet-stream",
    resumable: false,
    metadata: { uploadedBy: "service" },
  });
  const [signedUrl] = await blob.getSignedUrl({
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000,
  });
  return signedUrl;
}

// =================== BASE SERVICE ===================
class BaseService {
  constructor(table) { this.table = table; }

  async getAll() { return knex(this.table).select("*"); }
  async getById(id) {
    const row = await knex(this.table).where({ id }).first();
    if (!row) throw new Error(`${this.table} tidak ditemukan`);
    return row;
  }
  async create(data) {
    const [newRow] = await knex(this.table).insert(data).returning("*");
    return newRow;
  }
  async patch(id, data) {
    const [updated] = await knex(this.table).where({ id }).update(data).returning("*");
    if (!updated) throw new Error(`${this.table} tidak ditemukan`);
    return updated;
  }

  async delete(id) {
    const deleted = await knex(this.table).where({ id }).del().returning("*");
    if (!deleted || deleted.length === 0) throw new Error(`${this.table} tidak ditemukan`);
    return deleted[0];
  }
}

// =================== CUSTOMER SERVICES ===================
class SyaratKetentuanService extends BaseService { constructor() { super("syarat_ketentuan"); } }
class JadwalKirimService extends BaseService { constructor() { super("jadwal_kirim"); } }
class LokasiKontakService extends BaseService { constructor() { super("lokasi_kontak"); } }

class CaraKirimService extends BaseService {
  constructor() { super("cara_kirim"); }

  async create(data) {
    if (data.photo) {
      const filename = `${Date.now()}-${data.photo.name || "file"}`;
      data.photo_url = await uploadToGCS(data.photo._data || data.photo, filename, data.photo.type);
    }
    return super.create(data);
  }

  async patch(id, data) {
    if (data.photo) {
      const filename = `${id}-${Date.now()}-${data.photo.name || "file"}`;
      data.photo_url = await uploadToGCS(data.photo._data || data.photo, filename, data.photo.type);
    }
    return super.patch(id, data);
  }

  async delete(id) {
    // Ambil data lama supaya tahu file URL-nya
    const existing = await this.getById(id);

    // Hapus file dari GCS jika ada
    if (existing.photo_url) {
      try {
        const fileName = existing.photo_url.split("/").pop().split("?")[0]; // ambil nama file dari URL
        const file = bucket.file(fileName);
        await file.delete();
      } catch (err) {
        console.error("Gagal hapus file GCS:", err.message);
      }
    }

    // Hapus data dari DB
    return super.delete(id);
  }
}

class DaftarOngkirService extends BaseService { constructor() { super("daftar_ongkir"); } }
class SeringDitanyakanService extends BaseService { constructor() { super("sering_ditanyakan"); } }

module.exports = {
  SyaratKetentuanService: new SyaratKetentuanService(),
  JadwalKirimService: new JadwalKirimService(),
  LokasiKontakService: new LokasiKontakService(),
  CaraKirimService: new CaraKirimService(),
  DaftarOngkirService: new DaftarOngkirService(),
  SeringDitanyakanService: new SeringDitanyakanService(),
};