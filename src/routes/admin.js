import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, admin: { username: admin.username, nama: admin.nama, role: admin.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.admin = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Get all clients/assessments
router.get('/clients', authMiddleware, async (req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*, assessments(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get client detail
router.get('/clients/:id', authMiddleware, async (req, res) => {
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*, assessments(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!client) return res.status(404).json({ error: 'Client not found' });
    
    // Transform back to the format the frontend expects for the detail modal
    const assessment = client.assessments && client.assessments.length > 0 ? client.assessments[0] : null;
    const responseData = assessment ? {
      ...assessment,
      clients: client
    } : {
      clients: client,
      // Provide empty defaults if no assessment is completed
      answers: {},
      raw_scores: {},
      normalized_scores: {},
      categories: {},
      top3: [],
      bottom3: [],
      attention_check_passed: false,
      is_valid: false,
      persepsi_sesuai: null,
      persepsi_tidak_sesuai: null,
      pekerjaan_disenangi: [],
      pekerjaan_dikuasai: []
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete client
router.delete('/clients/:id', authMiddleware, async (req, res) => {
  try {
    // Delete assessments first to avoid foreign key constraints
    await supabase
      .from('assessments')
      .delete()
      .eq('client_id', req.params.id);

    const { data: client, error } = await supabase
      .from('clients')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!client) return res.status(404).json({ error: 'Client not found' });
    
    res.json({ message: 'Client deleted successfully', client });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { count: totalClients, error: clientError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    const { count: completedAssessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .not('completed_at', 'is', null);
    
    if (clientError) throw clientError;
    if (assessmentError) throw assessmentError;

    res.json({
      totalClients: totalClients || 0,
      completedAssessments: completedAssessments || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
