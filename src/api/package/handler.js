const PackageServices = require("../../services/PackageServices");
const service = new PackageServices();
const NotFoundError = require("../../exceptions/NotFoundError");
const ServerError = require("../../exceptions/ServerError");
const InvariantError = require("../../exceptions/InvariantError");

const createPackageHandler = async (request, h) => {
  try {
    const result = await service.createPackage(request.payload);
    return h.response({
      status: "success",
      message: "Paket berhasil disimpan",
      data: result,
    }).code(201);
  } catch (err) {
    if (err.name === "ClientError") {
      throw err;
    }
    console.error("Error create package:", err);
    throw new ServerError("Gagal menyimpan paket");
  }
};

const getAllPackagesHandler = async (request, h) => {
  const { filter = "", sortBy = "created_at", sortOrder = "desc", page = 1, limit = 50 } = request.query;
  const userCabang = request.auth?.credentials?.cabang;

  try {
    const packages = await service.getAllPackages({ filter, sortBy, sortOrder, page: Number(page), limit: Number(limit), userCabang });
    const total = await service.countPackages({ filter });

    return h.response({
      status: "success",
      data: {
        packages,
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    console.error("Error get packages:", err);
    throw new NotFoundError("Gagal mengambil daftar paket");
  }
};

const getAllArchivePackagesHandler = async (request, h) => {
  const { filter = "", sortBy = "created_at", sortOrder = "desc", page = 1, limit = 50 } = request.query;

  try {
    const packages = await service.getAllArchivePackages({ filter, sortBy, sortOrder, page: Number(page), limit: Number(limit) });
    const total = await service.countPackages({ filter });

    return h.response({
      status: "success",
      data: {
        packages,
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    console.error("Error get packages:", err);
    throw new NotFoundError("Gagal mengambil daftar paket");
  }
};

const addActivePackagesHandler = async (request, h) => {
  const { packageId } = request.params;

  try {
    const result = await service.addActivePackages(Number(packageId));
    return h.response({ status: "success", data: result }).code(200);
  } catch (err) {
      console.error("Error addActivePackagesHandler:", err);
      throw err instanceof InvariantError ? Boom.badRequest(err.message) : Boom.internal("Server error");
    }
};

const addArchivePackagesHandler = async (request, h) => {
  const { packageId } = request.params;

  try {
    const result = await service.addArchivePackages(Number(packageId));
    return h.response({ status: "success", data: result }).code(200);
  } catch (err) {
    console.error("Error addActivePackagesHandler").code(
      err instanceof InvariantError ? 400 : 500
    );
  }
};

const removeActivePackageByIdHandler = async (request, h) => {
  const { packageId } = request.params;

  try {
    await service.removeActivePackageById({ packageId });

    return h.response({
      status: "success",
      message: "Paket berhasil dihapus dari active_packages dan diarsipkan",
    });
  } catch (err) {
    console.error("Error removeActivePackageByIdHandler:", err);
    throw new ServerError("Gagal menghapus paket dari active_packages");
  }
};

module.exports = {
  createPackageHandler,
  addActivePackagesHandler,
  addArchivePackagesHandler,
  getAllPackagesHandler,
  getAllArchivePackagesHandler,
  removeActivePackageByIdHandler,
};