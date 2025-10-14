require("dotenv").config();
const Hapi = require("@hapi/hapi");
const fs = require("fs");
const path = require("path");

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  // === AUTO REGISTER ROUTES ===
  const apiDir = path.join(__dirname, "src/api");
  const folders = fs.readdirSync(apiDir);

  for (const folder of folders) {
    const folderPath = path.join(apiDir, folder);
    const indexFile = path.join(folderPath, "index.js");

    // pastikan folder punya index.js
    if (fs.existsSync(indexFile)) {
      const routes = require(indexFile);
      server.route(routes);
      console.log(`✅ Loaded routes from ${folder}`);
    }
  }

  // optional: route root biar gak 404
  server.route({
    method: "GET",
    path: "/",
    handler: () => ({
      status: "success",
      message: "GEX Server is running 🚀",
    }),
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init();