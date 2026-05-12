export const calculateRiasecScore = (answers) => {
  // Step 1: Jumlahkan skor per dimensi
  // R = Q1 + Q2 + Q3 + Q4
  // I = Q5 + Q6 + Q7 + Q8
  // A = Q9 + Q10 + Q11 + Q12
  // S = Q13 + Q14 + Q15 + Q16
  // E = Q17 + Q18 + Q19 + Q20
  // C = Q21 + Q22 + Q23 + Q24

  const rawScores = {
    R: (answers['Q1'] || 0) + (answers['Q2'] || 0) + (answers['Q3'] || 0) + (answers['Q4'] || 0),
    I: (answers['Q5'] || 0) + (answers['Q6'] || 0) + (answers['Q7'] || 0) + (answers['Q8'] || 0),
    A: (answers['Q9'] || 0) + (answers['Q10'] || 0) + (answers['Q11'] || 0) + (answers['Q12'] || 0),
    S: (answers['Q13'] || 0) + (answers['Q14'] || 0) + (answers['Q15'] || 0) + (answers['Q16'] || 0),
    E: (answers['Q17'] || 0) + (answers['Q18'] || 0) + (answers['Q19'] || 0) + (answers['Q20'] || 0),
    C: (answers['Q21'] || 0) + (answers['Q22'] || 0) + (answers['Q23'] || 0) + (answers['Q24'] || 0)
  };

  const normalizedScores = {};
  const categories = {};
  
  // RIASEC Profiles based on Research RIASEC.jpeg
  const riasecProfiles = {
    R: {
      deskripsi: 'Suka bekerja terutama dengan tangan, membuat, memperbaiki, merakit atau membangun sesuatu, menggunakan alat atau mesin, serta seringkali bekerja di luar ruangan. Suka merawat hewan, bekerja dengan tanaman.',
      keterampilanKunci: 'Menggunakan dan mengoperasikan peralatan, alat dan mesin, merancang, membangun, memperbaiki, bekerja secara manual, mengukur, detail, mekanik, mengemudi, bergerak, bekerja secara fisik.',
      contohPekerjaan: 'Pilot, petani, hortikultura, pembangun, insinyur, personel angkatan bersenjata, mekanik, tukang pelapis, tukang listrik, teknologi komputer, penjaga taman, olahragawan.'
    },
    I: {
      deskripsi: 'Suka menemukan dan meneliti, mengamati, menyelidiki, bereksperimen, mengajukan pertanyaan, menyelesaikan masalah.',
      keterampilanKunci: 'Berpikir analitis dan logis, menghitung, berkomunikasi tertulis dan lisan, mendiagnosis, merancang, merumuskan, ilmu pengetahuan, kimia, kelautan, kehutanan, laboratorium, medis atau kesehatan.',
      contohPekerjaan: 'Ilmuwan, penelitian, pekerja medis dan kesehatan, ahli kimia, ahli kelautan, teknisi kehutanan, teknisi pertanian, dokter, ahli biologi, psikolog.'
    },
    A: {
      deskripsi: 'Suka menggunakan kata-kata, seni, musik atau drama untuk berkomunikasi, melakukan, mengekspresikan diri, membuat dan merancang sesuatu.',
      keterampilanKunci: 'Mengekspresikan secara artistik atau fisik, berbicara, menulis, menyanyi, tampil, merancang, menyajikan, merencanakan, menyusun, bermain, menari.',
      contohPekerjaan: 'Artis, ilustrator, fotografer, penulis, komposer, penyanyi, musisi, penari, aktor, reporter, editor, pengiklan, penata rambut, perancang busana.'
    },
    S: {
      deskripsi: 'Suka mengajar, melatih dan memberi informasi, membantu, mengobati, menyembuhkan dan melayani, menyapa, peduli dengan kesejahteraan diri dan orang lain.',
      keterampilanKunci: 'Berkomunikasi secara lisan dan tertulis, peduli dan melatih, mendukung, bertemu, dan membantu, mewawancarai.',
      contohPekerjaan: 'Guru, perawat, asisten medis, penasihat, petugas kepolisian, pekerja sosial, tenaga pengajar, petugas layanan informasi, petugas penjualan, pelayanan pelanggan, sekretaris.'
    },
    E: {
      deskripsi: 'Suka bertemu dengan orang, memimpin, berbicara dan mempengaruhi orang lain, mendorong orang lain, bekerja dalam bisnis.',
      keterampilanKunci: 'Menjual, mempromosikan dan mengembangkan ide-ide, berbicara di depan umum, mengelola, mengatur, memimpin dan menangkap, menghitung, merencanakan.',
      contohPekerjaan: 'Tenaga penjual, pengacara, politisi, akuntan, pemilik bisnis, eksekutif manajer, agen perjalanan, promotor musik atau olahraga.'
    },
    C: {
      deskripsi: 'Suka bekerja di dalam ruangan dan pada tugas-tugas yang melibatkan detail, pengorganisasian akurasi, mengikuti prosedur, bekerja dengan data angka, perencanaan dan acara.',
      keterampilanKunci: 'Komputasi dan keyboarding, merekam dan menyimpan catatan, memperhatikan detail, bertemu dan menyapa, menghitung, menangani uang, mengatur, mengatur informasi.',
      contohPekerjaan: 'Sekretaris, resepsionis, pekerja kantor, pustakawan, petugas bank, operator komputer, pengelola toko, petugas pengiriman.'
    }
  };
  
  // Step 2 & 3: Normalisasi dan Kategori
  // Skala 1-4, 4 soal per dimensi → Min=4, Max=16, Range=12
  for (const [dim, score] of Object.entries(rawScores)) {
    // Normalization formula: ((Total - 4) / 12) * 100
    const normalized = Math.round(((score - 4) / 12) * 100);
    normalizedScores[dim] = normalized;

    if (normalized <= 39) categories[dim] = 'Rendah';
    else if (normalized <= 69) categories[dim] = 'Sedang';
    else categories[dim] = 'Tinggi';
  }

  // Step 4: Ranking
  const rankedProfile = Object.entries(normalizedScores)
    .map(([dimension, score]) => ({ dimension, score, category: categories[dimension] }))
    .sort((a, b) => b.score - a.score);

  const top3 = rankedProfile.slice(0, 3).map(p => p.dimension);
  const bottom3 = rankedProfile.slice(-3).map(p => p.dimension);

  // Attach profile details to ranked profile
  const detailedProfile = rankedProfile.map(p => ({
    ...p,
    detail: riasecProfiles[p.dimension]
  }));

  return {
    rawScores,
    normalizedScores,
    categories,
    rankedProfile: detailedProfile,
    top3,
    bottom3
  };
};
