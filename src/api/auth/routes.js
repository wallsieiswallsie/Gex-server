const { registerHandler, loginHandler, refreshHandler } = require("./handler");

const authRoutes = [
  {
    method: "POST",
    path: "/auth/register",
    handler: registerHandler,
  },
  {
    method: "POST",
    path: "/auth/login",
    handler: loginHandler,
  },
  {
    method: "POST",
    path: "/auth/refresh",
    handler: refreshHandler,
  },
];

module.exports = authRoutes;
