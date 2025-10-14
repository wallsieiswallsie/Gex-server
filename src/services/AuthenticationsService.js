const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const knex = require("../db");

const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY || "default-access-key";
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY || "default-refresh-key";

class AuthenticationService {
  static async register({ name, email, password, role, cabang }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await knex("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        cabang,
      })
      .returning(["id", "name", "email", "role", "cabang"]);

    return user;
  }

  static async login({ email, password }) {
    const user = await knex("users").where({ email }).first();
    if (!user) {
      throw new Error("User not found");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid credentials");
    }

    // 🔹 Buat access token & refresh token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role, cabang: user.cabang },
      ACCESS_TOKEN_KEY,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_KEY,
      { expiresIn: "30d" }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cabang: user.cabang,
      },
    };
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, ACCESS_TOKEN_KEY);
    } catch (err) {
      throw new Error("Invalid or expired access token");
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, REFRESH_TOKEN_KEY);
    } catch (err) {
      throw new Error("Invalid or expired refresh token");
    }
  }
}

module.exports = AuthenticationService;