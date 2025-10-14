function generateIdBatchesKapal() {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KPL-${randomStr}`;
}

function generateIdBatchesPesawat() {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PSW-${randomStr}`;
}

module.exports = { generateIdBatchesKapal, generateIdBatchesPesawat };
