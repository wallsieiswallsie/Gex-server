const Joi = require("joi");

const createPackagePayloadSchema = Joi.object({
  nama: Joi.string().required().messages({
    "string.base": "Nama harus berupa teks",
    "string.empty": "Nama wajib diisi",
    "any.required": "Nama wajib diisi",
  }),
  resi: Joi.string().required().messages({
    "string.base": "Resi harus berupa teks",
    "string.empty": "Resi wajib diisi",
    "any.required": "Resi wajib diisi",
  }),
  panjang: Joi.number().positive().required().messages({
    "number.base": "Panjang harus berupa angka",
    "number.positive": "Panjang harus lebih besar dari 0",
    "any.required": "Panjang wajib diisi",
  }),
  lebar: Joi.number().positive().required().messages({
    "number.base": "Lebar harus berupa angka",
    "number.positive": "Lebar harus lebih besar dari 0",
    "any.required": "Lebar wajib diisi",
  }),
  tinggi: Joi.number().positive().required().messages({
    "number.base": "Tinggi harus berupa angka",
    "number.positive": "Tinggi harus lebih besar dari 0",
    "any.required": "Tinggi wajib diisi",
  }),
  berat: Joi.number().positive().required().messages({
    "number.base": "Berat harus berupa angka",
    "number.positive": "Berat harus lebih besar dari 0",
    "any.required": "Berat wajib diisi",
  }),
  kode: Joi.string()
    .valid("JKSOQA", "JKSOQB", "JPSOQA", "JPSOQB")
    .required()
    .messages({
      "any.only": "Kode pengiriman tidak valid",
      "string.base": "Kode harus berupa teks",
      "string.empty": "Kode pengiriman wajib diisi",
      "any.required": "Kode pengiriman wajib diisi",
    }),
});

const getAllPackagesQuerySchema = Joi.object({
  filter: Joi.string().optional().messages({
    "string.base": "Filter harus berupa teks",
  }),
  sortBy: Joi.string()
    .valid("name", "created_at", "stock")
    .optional()
    .messages({
      "any.only": "SortBy hanya bisa 'name', 'created_at', atau 'stock'",
    }),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .messages({
      "any.only": "SortOrder hanya bisa 'asc' atau 'desc'",
    }),
});

module.exports = {
  createPackagePayloadSchema,
  getAllPackagesQuerySchema,
};