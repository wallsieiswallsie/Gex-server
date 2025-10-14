const Joi = require("joi");
const {
  createInvoiceHandler,
  getAllInvoicesHandler,
  getArchivedInvoicesHandler,
  getInvoiceByIdHandler,
  removePackageFromInvoiceHandler,
  addPackagesByResiToExistingInvoiceHandler,
  archiveInvoicesHandler,
} = require("./handler");

const invoiceRoutes = [
  {
    method: "POST",
    path: "/invoices",
    handler: createInvoiceHandler,
  },
  {
    method: "GET",
    path: "/invoices",
    handler: getAllInvoicesHandler,
  },
  {
    method: "GET",
    path: "/archived_invoices",
    handler: getArchivedInvoicesHandler,
  },
  {
    method: "GET",
    path: "/invoices/{id}",
    handler: getInvoiceByIdHandler,
  },
  {
    method: "DELETE",
    path: "/invoices/{id}/packages/{packageId}",
    handler: removePackageFromInvoiceHandler,
  },
  {
    method: "POST",
    path: "/invoices/{id}/packages",
    handler: addPackagesByResiToExistingInvoiceHandler,
  },
  {
    method: "POST",
    path: "/invoices/archive-packages",
    handler: archiveInvoicesHandler,
  }
];

module.exports = invoiceRoutes;