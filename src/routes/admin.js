import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Assessment from '../models/Assessment.js';
import Client from '../models/Client.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });
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
    const assessments = await Assessment.find()
      .populate('clientId')
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get client detail
router.get('/clients/:id', authMiddleware, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('clientId');
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const completedAssessments = await Assessment.countDocuments({ completedAt: { $exists: true } });
    
    res.json({
      totalClients,
      completedAssessments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
