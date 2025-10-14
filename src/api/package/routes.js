const {
  createPackageHandler,
  getAllPackagesHandler,
  getAllArchivePackagesHandler,
  removeActivePackageByIdHandler,
  addActivePackagesHandler,
  addArchivePackagesHandler,
} = require("./handler");

const packageRoutes = [
  {
    method: "POST",
    path: "/packages",
    handler: createPackageHandler,
  },
  {
    method: "GET",
    path: "/packages",
    handler: getAllPackagesHandler,
  },
  {
    method: "GET",
    path: "/archive_packages",
    handler: getAllArchivePackagesHandler,
  },
  {
    method: "POST",
    path: "/active_package/{packageId}",
    handler: addActivePackagesHandler,
  },
  {
    method: "POST",
    path: "/archive_package/{packageId}",
    handler: addArchivePackagesHandler,
  },
  {
    method: "DELETE",
    path: "/activePackages/{packageId}",
    handler: removeActivePackageByIdHandler,
  }
];

module.exports = packageRoutes;