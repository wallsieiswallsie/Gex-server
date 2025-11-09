const knex = require('../db');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// =================== GCS CONFIG ===================
const credentials = JSON.parse(process.env.GCLOUD_CREDENTIALS);
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials,
});
const bucket = storage.bucket(process.env.GCS_TUTORIAL_BUCKET);

async function uploadToGCS(buffer, filename, mimetype) {
  if (!buffer || buffer.length === 0) throw new Error('File buffer kosong');

  const blob = bucket.file(filename);
  await blob.save(buffer, {
    contentType: mimetype || 'application/octet-stream',
    resumable: false,
    metadata: { uploadedBy: 'service' },
  });

  const [signedUrl] = await blob.getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000,
  });

  return signedUrl;
}

// =================== SYARAT KETENTUAN ===================
class SyaratKetentuanService {
  constructor() { this.table = 'syarat_ketentuan'; }
  async getAll() { return knex(this.table).select('*'); }
  async getById(id) { 
    const row = await knex(this.table).where({ id }).first();
    if (!row) throw new Error('SyaratKetentuan tidak ditemukan');
    return row;
  }
  async create(data) { const [newRow] = await knex(this.table).insert(data).returning('*'); return newRow; }
  async update(id, data) { 
    const [updated] = await knex(this.table).where({ id }).update(data).returning('*');
    if (!updated) throw new Error('SyaratKetentuan tidak ditemukan'); 
    return updated; 
  }
}

// =================== JADWAL KIRIM ===================
class JadwalKirimService {
  constructor() { this.table = 'jadwal_kirim'; }
  async getAll() { return knex(this.table).select('*'); }
  async getById(id) { 
    const row = await knex(this.table).where({ id }).first();
    if (!row) throw new Error('JadwalKirim tidak ditemukan');
    return row;
  }
  async create(data) { const [newRow] = await knex(this.table).insert(data).returning('*'); return newRow; }
  async update(id, data) { 
    const [updated] = await knex(this.table).where({ id }).update(data).returning('*');
    if (!updated) throw new Error('JadwalKirim tidak ditemukan'); 
    return updated; 
  }
}

// =================== LOKASI KONTAK ===================
class LokasiKontakService {
  constructor() { this.table = 'lokasi_kontak'; }
  async getAll() { return knex(this.table).select('*'); }
  async getById(id) { 
    const row = await knex(this.table).where({ id }).first();
    if (!row) throw new Error('LokasiKontak tidak ditemukan');
    return row;
  }
  async create(data) { const [newRow] = await knex(this.table).insert(data).returning('*'); return newRow; }
  async update(id, data) { 
    const [updated] = await knex(this.table).where({ id }).update(data).returning('*');
    if (!updated) throw new Error('LokasiKontak tidak ditemukan'); 
    return updated; 
  }
}

// =================== CARA KIRIM ===================
class CaraKirimService {
  constructor() { this.table = 'cara_kirim'; }
  async getAll() { return knex(this.table).select('*'); }
  async getById(id) { 
    const row = await knex(this.table).where({ id }).first();
    if (!row) throw new Error('CaraKirim tidak ditemukan');
    return row;
  }
  async create(data) {
    if (data.photo) {
      const filename = `${Date.now()}-${data.photo.name || 'file'}`;
      data.photo_url = await uploadToGCS(data.photo._data || data.photo, filename, data.photo.type);
    }
    const [newRow] = await knex(this.table).insert(data).returning('*');
    return newRow;
  }
  async update(id, data) {
    if (data.photo) {
      const filename = `${id}-${Date.now()}-${data.photo.name || 'file'}`;
      data.photo_url = await uploadToGCS(data.photo._data || data.photo, filename, data.photo.type);
    }
    const [updated] = await knex(this.table).where({ id }).update(data).returning('*');
    if (!updated) throw new Error('CaraKirim tidak ditemukan');
    return updated;
  }
}

// =================== DAFTAR ONGKIR ===================
class DaftarOngkirService {
  constructor() { this.table = 'daftar_ongkir'; }
  async getAll() { return knex(this.table).select('*'); }
  async getById(id) { 
    const row = await knex(this.table).where({ id }).first();
    if (!row) throw new Error('DaftarOngkir tidak ditemukan');
    return row;
  }
  async create(data) { const [newRow] = await knex(this.table).insert(data).returning('*'); return newRow; }
  async update(id, data) { 
    const [updated] = await knex(this.table).where({ id }).update(data).returning('*');
    if (!updated) throw new Error('DaftarOngkir tidak ditemukan'); 
    return updated; 
  }
}

// =================== SERING DITANYAKAN ===================
class SeringDitanyakanService {
  constructor() { this.table = 'sering_ditanyakan'; }
  async getAll() { return knex(this.table).select('*'); }
  async getById(id) { 
    const row = await knex(this.table).where({ id }).first();
    if (!row) throw new Error('SeringDitanyakan tidak ditemukan');
    return row;
  }
  async create(data) { const [newRow] = await knex(this.table).insert(data).returning('*'); return newRow; }
  async update(id, data) { 
    const [updated] = await knex(this.table).where({ id }).update(data).returning('*');
    if (!updated) throw new Error('SeringDitanyakan tidak ditemukan'); 
    return updated; 
  }
}

// =================== EXPORT ===================
module.exports = {
  SyaratKetentuanService: new SyaratKetentuanService(),
  JadwalKirimService: new JadwalKirimService(),
  LokasiKontakService: new LokasiKontakService(),
  CaraKirimService: new CaraKirimService(),
  DaftarOngkirService: new DaftarOngkirService(),
  SeringDitanyakanService: new SeringDitanyakanService(),
};