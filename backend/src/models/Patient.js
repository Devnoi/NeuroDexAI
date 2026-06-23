import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  affectedSide: {
    type: String,
    enum: ['left', 'right'],
    required: true
  },
  therapistEmail: {
    type: String,
    trim: true,
    default: 'therapist@neurodex.com'
  }
}, {
  timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
