import mongoose from 'mongoose';

const rawLogSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true },
  targetX: { type: Number, default: 0 },
  targetY: { type: Number, default: 0 },
  targetShape: { type: String, enum: ['circle', 'square', 'none'], default: 'none' },
  targetColor: { type: String, enum: ['red', 'blue', 'none'], default: 'none' },
  isCorrectTarget: { type: Boolean, default: true },
  requiredHand: {
    type: String,
    enum: ['left', 'right', 'any'],
    default: 'any'
  },
  leftFingerX: { type: Number, default: 0 },
  leftFingerY: { type: Number, default: 0 },
  rightFingerX: { type: Number, default: 0 },
  rightFingerY: { type: Number, default: 0 },
  usedHand: {
    type: String,
    enum: ['left', 'right', 'none'],
    default: 'none'
  },
  state: {
    type: String,
    enum: ['resting', 'moving', 'hit', 'miss'],
    required: true
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  gameMode: {
    type: String,
    enum: ['random', 'forced'],
    default: 'random'
  },
  metrics: {
    overallSpeedScore: { type: Number, default: 0 },
    overallAccuracyScore: { type: Number, default: 0 },
    overallQualityScore: { type: Number, default: 0 },
    overallCognitiveScore: { type: Number, default: 100 },
    
    // Left hand metrics
    leftHandSpeed: { type: Number, default: 0 },
    leftHandAccuracy: { type: Number, default: 0 },
    leftHandQuality: { type: Number, default: 0 },

    // Right hand metrics
    rightHandSpeed: { type: Number, default: 0 },
    rightHandAccuracy: { type: Number, default: 0 },
    rightHandQuality: { type: Number, default: 0 },

    limbSelectionRatio: { type: Number, default: 0 }
    ,
    leftDominanceScore: { type: Number, default: 0 },
    rightDominanceScore: { type: Number, default: 0 },
    predictedDominantHand: {
      type: String,
      enum: ['left', 'right', 'balanced', 'undetermined'],
      default: 'undetermined'
    },
    learnedNonUseRisk: {
      type: String,
      enum: ['low', 'moderate', 'high', 'undetermined'],
      default: 'undetermined'
    }
  },
  rawLogs: [rawLogSchema]
}, {
  timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
