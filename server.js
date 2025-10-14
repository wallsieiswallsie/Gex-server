const Hapi = require("@hapi/hapi");

const init = async () => {
  const server = Hapi.server({
    port: 5000,
    host: "localhost",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  const packageRoutes = require("./src/api/package");
  const authRoutes = require("./src/api/auth");
  const invoiceRoutes = require("./src/api/invoice");
  const batchRoutes = require("./src/api/batch");
  const statusRoutes = require("./src/api/status")
  const deliveryRoutes = require("./src/api/delivery")

  server.route(packageRoutes);
  server.route(authRoutes);
  server.route(invoiceRoutes);
  server.route(batchRoutes);
  server.route(statusRoutes);
  server.route(deliveryRoutes);

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

init();
