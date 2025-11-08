const AuthenticationService = require("../../services/AuthenticationsService");
const ClientError = require("../../exceptions/ClientError");
const AuthenticationError = require("../../exceptions/AuthenticationError");
const jwt = require("jsonwebtoken");

const registerHandler = async (request, h) => {
  try {
    const { name, email, password, role, cabang } = request.payload;

    if (!cabang) {
      return h.response({ error: "Cabang wajib dipilih" }).code(400);
    }

    const user = await AuthenticationService.register({
      name,
      email,
      password,
      role,
      cabang,
    });

    return h.response(user).code(201);
  } catch (err) {
    if (err instanceof ClientError) {
      return h.response({ error: err.message }).code(err.statusCode);
    }
    console.error(err);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

const loginHandler = async (request, h) => {
  try {
    const result = await AuthenticationService.login(request.payload);
    return h.response(result).code(200);
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return h.response({ error: err.message }).code(401);
    }
    if (err instanceof ClientError) {
      return h.response({ error: err.message }).code(err.statusCode);
    }
    console.error(err);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

const refreshHandler = async (request, h) => {
  try {
    const { refreshToken } = request.payload;
    if (!refreshToken) {
      throw new AuthenticationError("Refresh token is required");
    }

    // Verifikasi refresh token
    const payload = AuthenticationService.verifyRefreshToken(refreshToken);

    // Buat access token baru
    const accessToken = jwt.sign(
      { id: payload.id, role: payload.role, cabang: payload.cabang }, // ✅ Sertakan cabang
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: "15m" }
    );

    return h.response({ accessToken }).code(200);
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return h.response({ error: err.message }).code(401);
    }
    if (err instanceof ClientError) {
      return h.response({ error: err.message }).code(err.statusCode);
    }
    console.error(err);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

module.exports = {
  registerHandler,
  loginHandler,
  refreshHandler,
};