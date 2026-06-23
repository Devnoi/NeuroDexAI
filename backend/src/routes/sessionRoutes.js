import express from 'express';
import Session from '../models/Session.js';
import Patient from '../models/Patient.js';
import { MedicalAssessmentEngine } from '../utils/MedicalAssessmentEngine.js';
import { AlertService } from '../utils/alertService.js';

const router = express.Router();

// In-memory fallback database arrays
const memoryPatients = [];
const memorySessions = [];

// Create or save a new session
router.post('/sessions', async (req, res) => {
  try {
    const { sessionId, patientId, rawLogs, date, gameMode } = req.body;

    if (!sessionId || !patientId || !rawLogs) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, patientId, rawLogs' });
    }

    // Get patient to check affectedSide and email
    let patientObj = null;
    let patientSessions = [];

    if (global.useMemoryDB) {
      patientObj = memoryPatients.find(p => p.patientId === patientId) || {
        patientId,
        name: 'Patient',
        affectedSide: 'right',
        therapistEmail: 'therapist@neurodex.com'
      };
    } else {
      patientObj = await Patient.findOne({ patientId });
    }

    // Run the Medical Assessment Engine to calculate/validate metrics
    const analysis = MedicalAssessmentEngine.analyze(rawLogs, {
      affectedSide: patientObj?.affectedSide || 'right'
    });

    const sessionData = {
      sessionId,
      patientId,
      date: date || new Date().toISOString(),
      gameMode: gameMode || 'random',
      metrics: {
        overallSpeedScore: analysis.overallSpeedScore,
        overallAccuracyScore: analysis.overallAccuracyScore,
        overallQualityScore: analysis.overallQualityScore,
        overallCognitiveScore: analysis.overallCognitiveScore,
        
        leftHandSpeed: analysis.leftHand.speed,
        leftHandAccuracy: analysis.leftHand.accuracy,
        leftHandQuality: analysis.leftHand.quality,
        
        rightHandSpeed: analysis.rightHand.speed,
        rightHandAccuracy: analysis.rightHand.accuracy,
        rightHandQuality: analysis.rightHand.quality,
        
        limbSelectionRatio: analysis.limbSelectionRatio,
        leftDominanceScore: analysis.leftDominanceScore,
        rightDominanceScore: analysis.rightDominanceScore,
        predictedDominantHand: analysis.predictedDominantHand,
        learnedNonUseRisk: analysis.learnedNonUseRisk
      },
      rawLogs
    };

    let alertResult = null;

    if (global.useMemoryDB) {
      memorySessions.push(sessionData);
      patientSessions = memorySessions.filter(s => s.patientId === patientId);
      
      if (patientObj) {
        alertResult = AlertService.checkAndSendAlert(patientObj, patientSessions);
      }

      res.status(201).json({
        message: 'Session saved successfully (In-Memory Fallback)',
        session: {
          sessionId: sessionData.sessionId,
          patientId: sessionData.patientId,
          date: sessionData.date,
          metrics: sessionData.metrics,
          calculatedMetrics: analysis.detailedMetrics,
          alertTriggered: alertResult ? true : false,
          alertInfo: alertResult
        }
      });
    } else {
      const session = new Session(sessionData);
      await session.save();

      // Retrieve all past sessions of this patient to check decline
      patientSessions = await Session.find({ patientId }).sort({ date: 1 });

      if (patientObj) {
        alertResult = AlertService.checkAndSendAlert(patientObj, patientSessions);
      }

      res.status(201).json({
        message: 'Session saved successfully',
        session: {
          sessionId: session.sessionId,
          patientId: session.patientId,
          date: session.date,
          metrics: session.metrics,
          calculatedMetrics: analysis.detailedMetrics,
          alertTriggered: alertResult ? true : false,
          alertInfo: alertResult
        }
      });
    }
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Get all sessions
router.get('/sessions', async (req, res) => {
  try {
    if (global.useMemoryDB) {
      res.json([...memorySessions].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      const sessions = await Session.find().sort({ date: -1 });
      res.json(sessions);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get sessions for a specific patient
router.get('/sessions/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    if (global.useMemoryDB) {
      const patientSessions = memorySessions.filter(s => s.patientId === patientId);
      res.json(patientSessions.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      const sessions = await Session.find({ patientId }).sort({ date: -1 });
      res.json(sessions);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient sessions' });
  }
});

// Create a new patient
router.post('/patients', async (req, res) => {
  try {
    const { patientId, name, affectedSide, therapistEmail } = req.body;
    if (!patientId || !name || !affectedSide) {
      return res.status(400).json({ error: 'Missing patientId, name, or affectedSide' });
    }

    if (global.useMemoryDB) {
      const existingIndex = memoryPatients.findIndex(p => p.patientId === patientId);
      const patient = {
        patientId,
        name,
        affectedSide,
        therapistEmail: therapistEmail || 'therapist@neurodex.com'
      };
      if (existingIndex !== -1) {
        memoryPatients[existingIndex] = { ...memoryPatients[existingIndex], ...patient };
      } else {
        memoryPatients.push(patient);
      }
      res.status(201).json({ message: 'Patient saved successfully (In-Memory Fallback)', patient: existingIndex !== -1 ? memoryPatients[existingIndex] : patient });
    } else {
      // Upsert or create patient
      const patient = await Patient.findOneAndUpdate(
        { patientId },
        { name, affectedSide, therapistEmail: therapistEmail || 'therapist@neurodex.com' },
        { new: true, upsert: true }
      );
      res.status(201).json({ message: 'Patient saved successfully', patient });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save patient', details: error.message });
  }
});

// Get all patients
router.get('/patients', async (req, res) => {
  try {
    if (global.useMemoryDB) {
      res.json(memoryPatients);
    } else {
      const patients = await Patient.find();
      res.json(patients);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

export default router;
