import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  
  answers: {
    type: Map,
    of: Number, // 1-4 (Sangat Tidak Setuju=1 s/d Sangat Setuju=4)
    required: true
  },
  
  attentionCheckPassed: { type: Boolean, required: true },
  
  rawScores: {
    R: { type: Number, default: 0 },
    I: { type: Number, default: 0 },
    A: { type: Number, default: 0 },
    S: { type: Number, default: 0 },
    E: { type: Number, default: 0 },
    C: { type: Number, default: 0 }
  },
  
  normalizedScores: {
    R: { type: Number, default: 0 },
    I: { type: Number, default: 0 },
    A: { type: Number, default: 0 },
    S: { type: Number, default: 0 },
    E: { type: Number, default: 0 },
    C: { type: Number, default: 0 }
  },
  
  categories: {
    R: String,
    I: String,
    A: String,
    S: String,
    E: String,
    C: String
  },
  
  rankedProfile: [{ 
    dimension: String, 
    score: Number, 
    category: String 
  }],
  
  top3: [String],
  bottom3: [String],
  
  persepsiSesuai: String,
  persepsiTidakSesuai: String,
  
  pekerjaanDisenangi: [String],
  pekerjaanDikuasai: [String],
  
  isValid: { type: Boolean, default: true },
  completedAt: Date
}, { timestamps: true });

export default mongoose.model('Assessment', assessmentSchema);
