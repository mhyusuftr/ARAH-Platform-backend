import express from 'express';
import Client from '../models/Client.js';
import Assessment from '../models/Assessment.js';
import { calculateRiasecScore } from '../services/riasecScoring.js';

const router = express.Router();

// 1. Submit Biodata (Start Assessment)
router.post('/start', async (req, res) => {
  try {
    const clientData = req.body;
    const client = new Client(clientData);
    await client.save();
    res.status(201).json({ clientId: client._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Submit Questionnaire Answers
router.post('/submit', async (req, res) => {
  try {
    const { clientId, answers, attentionCheck } = req.body;
    
    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Verify attention check (Should be False/"Tidak" for "Saya lahir tahun 2030")
    const attentionCheckPassed = attentionCheck === false || attentionCheck === 'Tidak';

    // Calculate Scores
    const scoringResult = calculateRiasecScore(answers);

    // Save Assessment
    const assessment = new Assessment({
      clientId,
      answers,
      attentionCheckPassed,
      isValid: attentionCheckPassed,
      ...scoringResult
    });

    await assessment.save();
    res.status(201).json({ 
      assessmentId: assessment._id, 
      top3: assessment.top3,
      bottom3: assessment.bottom3,
      rankedProfile: assessment.rankedProfile,
      isValid: assessment.isValid
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Submit Validation (Slide 4)
router.post('/validate', async (req, res) => {
  try {
    const { assessmentId, persepsiSesuai, persepsiTidakSesuai, pekerjaanDisenangi, pekerjaanDikuasai } = req.body;
    
    const assessment = await Assessment.findByIdAndUpdate(
      assessmentId, 
      {
        persepsiSesuai,
        persepsiTidakSesuai,
        pekerjaanDisenangi,
        pekerjaanDikuasai,
        completedAt: new Date()
      },
      { new: true }
    );

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
    const assessment = await Assessment.findById(req.params.id).populate('clientId');
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    // Here we would also fetch the RiasecContent based on the Top 1 profile
    // to include the descriptions and recommendations in the response.
    
    res.json(assessment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
