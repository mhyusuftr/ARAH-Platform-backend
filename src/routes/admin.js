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
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('*, clients(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get client detail
router.get('/clients/:id', authMiddleware, async (req, res) => {
  try {
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*, clients(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json(assessment);
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
