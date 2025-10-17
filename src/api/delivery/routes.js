const {
  postPengantaranHandler,
  addPackageToPengantaranActiveHandler,
  addPackageToPengantaranArchiveHandler,
  getPengantaranByIdHandler,
  getAllPengantaranHandler,
  getPengantaranActiveHandler,
  getPengantaranArchiveHandler,
} = require("./handler");

const deliveryRoutes = [
  {
    method: "POST",
    path: "/pengantaran",
    handler: postPengantaranHandler,
  },
  {
    method: "PATCH",
    path: "/pengantaran",
    handler: addPackageToPengantaranActiveHandler,
  },
  {
    method: "PATCH",
    path: "/pengantaran_archive",
    handler: addPackageToPengantaranArchiveHandler,
  },
  {
    method: "GET",
    path: "/pengantaran",
    handler: getAllPengantaranHandler,
  },
  {
    method: "GET",
    path: "/pengantaran_active",
    handler: getPengantaranActiveHandler,
  },
  {
    method: "GET",
    path: "/pengantaran_archive",
    handler: getPengantaranArchiveHandler,
  },
  {
    method: "GET",
    path: "/pengantaran/{id}",
    handler: getPengantaranByIdHandler,
  },
];

module.exports = deliveryRoutes;