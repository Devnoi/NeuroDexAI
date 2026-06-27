import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['patient', 'therapist'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Consultation = mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);
export default Consultation;
