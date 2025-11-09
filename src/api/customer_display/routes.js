const {
  syaratKetentuanHandlers,
  jadwalKirimHandlers,
  lokasiKontakHandlers,
  caraKirimHandlers,
  daftarOngkirHandlers,
  seringDitanyakanHandlers,
} = require("./handler");

const customerRoutes = [
  // SYARAT KETENTUAN
  { method: "GET", path: "/customer/syarat-ketentuan", handler: syaratKetentuanHandlers.getAll },
  { method: "GET", path: "/customer/syarat-ketentuan/{id}", handler: syaratKetentuanHandlers.getById },
  { method: "POST", path: "/customer/syarat-ketentuan", handler: syaratKetentuanHandlers.create },
  { method: "PATCH", path: "/customer/syarat-ketentuan/{id}", handler: syaratKetentuanHandlers.patch },
  { method: "DELETE", path: "/customer/syarat-ketentuan/{id}", handler: syaratKetentuanHandlers.delete },

  // JADWAL KIRIM
  { method: "GET", path: "/customer/jadwal-kirim", handler: jadwalKirimHandlers.getAll },
  { method: "GET", path: "/customer/jadwal-kirim/{id}", handler: jadwalKirimHandlers.getById },
  { method: "POST", path: "/customer/jadwal-kirim", handler: jadwalKirimHandlers.create },
  { method: "PATCH", path: "/customer/jadwal-kirim/{id}", handler: jadwalKirimHandlers.patch },
  { method: "DELETE", path: "/customer/jadwal-kirim/{id}", handler: jadwalKirimHandlers.delete },

  // LOKASI KONTAK
  { method: "GET", path: "/customer/lokasi-kontak", handler: lokasiKontakHandlers.getAll },
  { method: "GET", path: "/customer/lokasi-kontak/{id}", handler: lokasiKontakHandlers.getById },
  { method: "POST", path: "/customer/lokasi-kontak", handler: lokasiKontakHandlers.create },
  { method: "PATCH", path: "/customer/lokasi-kontak/{id}", handler: lokasiKontakHandlers.patch },
  { method: "DELETE", path: "/customer/lokasi-kontak/{id}", handler: lokasiKontakHandlers.delete },

  // CARA KIRIM
  { method: "GET", path: "/customer/cara-kirim", handler: caraKirimHandlers.getAll },
  { method: "GET", path: "/customer/cara-kirim/{id}", handler: caraKirimHandlers.getById },
  { method: "POST", path: "/customer/cara-kirim", handler: caraKirimHandlers.create },
  { method: "PATCH", path: "/customer/cara-kirim/{id}", handler: caraKirimHandlers.patch },
  { method: "DELETE", path: "/customer/cara-kirim/{id}", handler: caraKirimHandlers.delete },

  // DAFTAR ONGKIR
  { method: "GET", path: "/customer/daftar-ongkir", handler: daftarOngkirHandlers.getAll },
  { method: "GET", path: "/customer/daftar-ongkir/{id}", handler: daftarOngkirHandlers.getById },
  { method: "POST", path: "/customer/daftar-ongkir", handler: daftarOngkirHandlers.create },
  { method: "PATCH", path: "/customer/daftar-ongkir/{id}", handler: daftarOngkirHandlers.patch },
  { method: "DELETE", path: "/customer/daftar-ongkir/{id}", handler: daftarOngkirHandlers.delete },

  // SERING DITANYAKAN
  { method: "GET", path: "/customer/sering-ditanyakan", handler: seringDitanyakanHandlers.getAll },
  { method: "GET", path: "/customer/sering-ditanyakan/{id}", handler: seringDitanyakanHandlers.getById },
  { method: "POST", path: "/customer/sering-ditanyakan", handler: seringDitanyakanHandlers.create },
  { method: "PATCH", path: "/customer/sering-ditanyakan/{id}", handler: seringDitanyakanHandlers.patch },
  { method: "DELETE", path: "/customer/sering-ditanyakan/{id}", handler: seringDitanyakanHandlers.delete },
];

module.exports = customerRoutes;