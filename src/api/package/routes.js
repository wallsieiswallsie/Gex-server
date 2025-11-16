const {
  createPackageHandler,
  getAllPackagesHandler,
  getAllArchivePackagesHandler,
  removeActivePackageByIdHandler,
  addActivePackagesHandler,
  addArchivePackagesHandler,
  confirmPackageHandler,
  getUnmovedConfirmedPackagesHandler,
  markPackageMovedHandler,
  updatePackageHandler,
} = require("./handler");

const packageRoutes = [
  {
    method: "POST",
    path: "/packages",
    options: {
      payload: {
        output: "data",
        parse: true,
        multipart: true,
        maxBytes: 5 * 1024 * 1024, // 5 MB
      },
    },
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
  },
  {
    method: "POST",
    path: "/packages/confirm",
    handler: confirmPackageHandler,
  },
  {
    method: "GET",
    path: "/packages/confirm-unmoved",
    handler: getUnmovedConfirmedPackagesHandler,
  },
  {
    method: "POST",
    path: "/packages/confirm-moved",
    handler: markPackageMovedHandler,
  },
  {
    method: "PATCH",
    path: "/packages/update",
    handler: updatePackageHandler,
  },

];

module.exports = packageRoutes;