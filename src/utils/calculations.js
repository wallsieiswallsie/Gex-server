const calculatePackageDetails = (pkg) => {
  // Pastikan semua angka valid, default 0
  const actualWeight = Number(pkg.berat) || 0;
  const panjang = Number(pkg.panjang) || 0;
  const lebar = Number(pkg.lebar) || 0;
  const tinggi = Number(pkg.tinggi) || 0;

  // Hitung berat volume
  const volumeWeightKapal = (panjang * lebar * tinggi) / 4000;
  const volumeWeightPesawat = (panjang * lebar * tinggi) / 6000;

  // Tentukan via berdasarkan kode
  const getVia = (kode) => {
    if (kode === "JKSOQA" || kode === "JKSOQB") return "Kapal";
    if (kode === "JPSOQA" || kode === "JPSOQB") return "Pesawat";
    return null; // kalau kode invalid
  };

  const via = getVia(pkg.kode);

  // Tentukan berat yang dipakai
  let weightUsed = actualWeight;
  if (via === "Kapal") weightUsed = Math.max(volumeWeightKapal, actualWeight);
  if (via === "Pesawat") weightUsed = Math.max(volumeWeightPesawat, actualWeight);

  // Hitung harga
  let price = 0;
  if (via === "Kapal") {
    if (weightUsed < 1) {
      // Bulatkan ke atas ke kelipatan 0.1
      const roundedWeight = Math.ceil(weightUsed * 10) / 10;
      price = roundedWeight * 12000;
    } else {
      price = weightUsed * 12000;
    }
  }

  if (via === "Pesawat") {
    if (weightUsed < 0.8) {
      const roundedWeight = Math.ceil(weightUsed / 0.05) * 0.5;
      price = roundedWeight * 10000;
    } else {
      price = weightUsed * 80000;
    }
  }


  return {
    actualWeight,
    volumeWeightKapal,
    volumeWeightPesawat,
    weightUsed,
    price,
    via,
  };
};

const calculateBatchDetails = (packages) => {
  const totalWeight = packages.reduce((sum, pkg) => sum + Number(pkg.berat_dipakai || 0), 0);
  const totalValue = packages.reduce((sum, pkg) => sum + Number(pkg.harga || 0), 0);

  return { totalWeight, totalValue };
}

export { calculatePackageDetails, calculateBatchDetails };