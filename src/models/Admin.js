import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // will be hashed
  nama: { type: String, required: true },
  role: { type: String, enum: ['admin', 'pk'], default: 'pk' }
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);
