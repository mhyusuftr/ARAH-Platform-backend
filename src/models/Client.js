import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  usia: { type: Number, required: true },
  jenisKelamin: { type: String, enum: ['Laki-laki', 'Perempuan'], required: true },
  alamat: { type: String, required: true },
  statusPerkawinan: { type: String, enum: ['Belum menikah', 'Menikah', 'Cerai'], required: true },
  dukunganKeluarga: { type: Boolean, required: true },
  tanggungan: { type: Boolean, required: true },
  pendidikanTerakhir: { 
    type: String, 
    enum: ['Tidak sekolah', 'SD', 'SMP', 'SMA/SMK', 'Diploma/Sarjana', 'Magister'], 
    required: true 
  }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
