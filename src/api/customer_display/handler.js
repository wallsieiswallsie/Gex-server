const {
  SyaratKetentuanService,
  JadwalKirimService,
  LokasiKontakService,
  CaraKirimService,
  DaftarOngkirService,
  SeringDitanyakanService,
} = require("../../services/CustomerServices");

// =================== GENERIC HANDLER ===================
function generateHandlers(service) {
  return {
    getAll: async (req, h) => {
      try {
        const data = await service.getAll();
        return h.response({ status: "success", data }).code(200);
      } catch (err) {
        return h.response({ status: "fail", message: err.message }).code(400);
      }
    },
    getById: async (req, h) => {
      try {
        const { id } = req.params;
        const data = await service.getById(id);
        return h.response({ status: "success", data }).code(200);
      } catch (err) {
        return h.response({ status: "fail", message: err.message }).code(400);
      }
    },
    create: async (req, h) => {
      try {
        const data = await service.create(req.payload);
        return h.response({ status: "success", data }).code(201);
      } catch (err) {
        return h.response({ status: "fail", message: err.message }).code(400);
      }
    },
    patch: async (req, h) => {
      try {
        const { id } = req.params;
        const data = await service.patch(id, req.payload);
        return h.response({ status: "success", data }).code(200);
      } catch (err) {
        return h.response({ status: "fail", message: err.message }).code(400);
      }
    },
  };
}

// =================== HANDLERS ===================
module.exports = {
  syaratKetentuanHandlers: generateHandlers(SyaratKetentuanService),
  jadwalKirimHandlers: generateHandlers(JadwalKirimService),
  lokasiKontakHandlers: generateHandlers(LokasiKontakService),
  caraKirimHandlers: generateHandlers(CaraKirimService),
  daftarOngkirHandlers: generateHandlers(DaftarOngkirService),
  seringDitanyakanHandlers: generateHandlers(SeringDitanyakanService),
};