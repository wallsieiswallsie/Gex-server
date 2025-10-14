function generateInvoiceId() {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${randomStr}`;
}

module.exports = { generateInvoiceId };
function generateInvoiceId() {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${randomStr}`;
}

module.exports = { generateInvoiceId };
