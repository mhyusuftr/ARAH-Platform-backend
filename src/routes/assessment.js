import express from 'express';
import { supabase } from '../utils/supabase.js';
import { calculateRiasecScore } from '../services/riasecScoring.js';

const router = express.Router();

// 1. Submit Biodata (Start Assessment)
router.post('/start', async (req, res) => {
  try {
    const clientData = req.body;
    const { data, error } = await supabase
      .from('clients')
      .insert({
        nama: clientData.nama,
        usia: clientData.usia,
        jenis_kelamin: clientData.jenisKelamin,
        alamat: clientData.alamat,
        status_perkawinan: clientData.statusPerkawinan,
        dukungan_keluarga: clientData.dukunganKeluarga,
        tanggungan: clientData.tanggungan,
        pendidikan_terakhir: clientData.pendidikanTerakhir
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ clientId: data.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Submit Questionnaire Answers
router.post('/submit', async (req, res) => {
  try {
    const { clientId, answers, attentionCheck } = req.body;
    
    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Verify attention check (Should be False/"Tidak" for "Saya lahir tahun 2030")
    const attentionCheckPassed = attentionCheck === false || attentionCheck === 'Tidak';

    // Calculate Scores
    const scoringResult = calculateRiasecScore(answers);

    // Save Assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        client_id: clientId,
        answers: answers,
        attention_check_passed: attentionCheckPassed,
        is_valid: attentionCheckPassed,
        raw_scores: scoringResult.rawScores,
        normalized_scores: scoringResult.normalizedScores,
        categories: scoringResult.categories,
        ranked_profile: scoringResult.rankedProfile,
        top3: scoringResult.top3,
        bottom3: scoringResult.bottom3
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    res.status(201).json({ 
      assessmentId: assessment.id, 
      top3: assessment.top3,
      bottom3: assessment.bottom3,
      rankedProfile: assessment.ranked_profile,
      isValid: assessment.is_valid
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Submit Validation (Slide 4)
router.post('/validate', async (req, res) => {
  try {
    const { assessmentId, persepsiSesuai, persepsiTidakSesuai, pekerjaanDisenangi, pekerjaanDikuasai } = req.body;
    
    const { data: assessment, error } = await supabase
      .from('assessments')
      .update({
        persepsi_sesuai: persepsiSesuai,
        persepsi_tidak_sesuai: persepsiTidakSesuai,
        pekerjaan_disenangi: pekerjaanDisenangi,
        pekerjaan_dikuasai: pekerjaanDikuasai,
        completed_at: new Date().toISOString()
      })
      .eq('id', assessmentId)
      .select()
      .single();

    if (error) throw error;
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Get Final Result
router.get('/result/:id', async (req, res) => {
  try {
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*, clients(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json(assessment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
