const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET } = require("../utils/constants");
const InvariantError = require("../exceptions/InvariantError");

class AuthorizationServices {
  constructor() {}

  /**
   * Ambil payload user dari token JWT
   * @param {string} token JWT dari header Authorization
   * @returns {object} payload user { id, name, cabang, ... }
   */
  verifyToken(token) {
    if (!token) throw new InvariantError("Authorization token tidak ditemukan");

    try {
      // token biasanya "Bearer <token>"
      const cleanToken = token.replace(/^Bearer\s+/i, "");
      const payload = jwt.verify(cleanToken, ACCESS_TOKEN_SECRET);
      return payload;
    } catch (err) {
      throw new InvariantError("Token tidak valid atau kadaluarsa");
    }
  }

  /**
   * Ambil cabang user dari token
   * @param {string} token
   * @returns {string} cabang user
   */
  getUserCabang(token) {
    const payload = this.verifyToken(token);
    if (!payload.cabang) throw new InvariantError("Cabang user tidak ditemukan di token");
    return payload.cabang;
  }

  /**
   * Cek apakah user termasuk cabang tertentu
   * @param {string} token
   * @param {string[]} allowedCabang
   * @returns {boolean}
   */
  isCabangAllowed(token, allowedCabang = []) {
    const userCabang = this.getUserCabang(token);
    return allowedCabang.includes(userCabang);
  }
}

module.exports = AuthorizationServices;