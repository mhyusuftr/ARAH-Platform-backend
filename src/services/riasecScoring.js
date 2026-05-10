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
  
  // Step 2 & 3: Normalisasi dan Kategori
  for (const [dim, score] of Object.entries(rawScores)) {
    // Normalization formula: ((Total - 4) / 12) * 100
    // Prevent negative if score < 4 (e.g. if 'kurang paham' was chosen)
    const validScore = Math.max(score, 4); 
    const normalized = Math.round(((validScore - 4) / 12) * 100);
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

  return {
    rawScores,
    normalizedScores,
    categories,
    rankedProfile,
    top3,
    bottom3
  };
};
