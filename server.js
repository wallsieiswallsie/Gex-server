require("dotenv").config();
const Hapi = require("@hapi/hapi");
const fs = require("fs");
const path = require("path");

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || "0.0.0.0",
    routes: {
      cors: { origin: ["*"] },
    },
  });

  try {
    // === AUTO REGISTER ROUTES ===
    const apiDir = path.join(__dirname, "src/api");
    const folders = fs.readdirSync(apiDir);

    for (const folder of folders) {
      const folderPath = path.join(apiDir, folder);
      const indexFile = path.join(folderPath, "index.js");

      if (fs.existsSync(indexFile)) {
        const routes = require(indexFile);
        server.route(routes);
        console.log(`✅ Loaded routes from ${folder}`);
      }
    }

    // Root route
    server.route({
      method: "GET",
      path: "/",
      handler: () => ({
        status: "success",
        message: "GEX Server is running 🚀",
      }),
    });

    await server.start();
    console.log(`🚀 Server running on ${server.info.uri}`);
  } catch (err) {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled rejection:", err);
  process.exit(1);
});

init();