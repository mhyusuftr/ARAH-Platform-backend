import mongoose from 'mongoose';

const riasecContentSchema = new mongoose.Schema({
  dimension: { type: String, required: true, unique: true }, // R, I, A, S, E, C
  namaLengkap: { type: String, required: true },
  subtitle: { type: String, required: true },
  deskripsi: { type: String, required: true },
  ciriKhas: [String],
  rekomendasiPekerjaan: [String],
  saranKegiatan: [String],
  saranPengembangan: { type: String, required: true }
});

export default mongoose.model('RiasecContent', riasecContentSchema);
