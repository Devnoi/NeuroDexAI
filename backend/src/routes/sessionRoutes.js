import express from 'express';
import Session from '../models/Session.js';
import Patient from '../models/Patient.js';
import { MedicalAssessmentEngine } from '../utils/MedicalAssessmentEngine.js';
import { AlertService } from '../utils/alertService.js';
import supabaseStore from '../utils/supabaseStore.js';

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

    if (supabaseStore.isSupabaseConfigured()) {
      patientObj = await supabaseStore.findPatient(patientId) || {
        patientId,
        name: 'Patient',
        affectedSide: 'right',
        therapistEmail: 'therapist@neurodex.com'
      };
    } else if (global.useMemoryDB) {
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

    if (supabaseStore.isSupabaseConfigured()) {
      const session = await supabaseStore.saveSession(sessionData);
      patientSessions = await supabaseStore.listSessionsByPatient(patientId);

      if (patientObj) {
        alertResult = AlertService.checkAndSendAlert(patientObj, patientSessions);
      }

      res.status(201).json({
        message: 'Session saved successfully (Supabase)',
        session: {
          sessionId: session.sessionId,
          patientId: session.patientId,
          date: session.date,
          metrics: session.metrics,
          calculatedMetrics: analysis.detailedMetrics,
          alertTriggered: alertResult ? true : false,
          alertInfo: alertResult,
          storage: 'supabase'
        }
      });
    } else if (global.useMemoryDB) {
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
    if (supabaseStore.isSupabaseConfigured()) {
      const sessions = await supabaseStore.listSessions();
      res.json(sessions);
    } else if (global.useMemoryDB) {
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
    if (supabaseStore.isSupabaseConfigured()) {
      const sessions = await supabaseStore.listSessionsByPatient(patientId);
      res.json(sessions);
    } else if (global.useMemoryDB) {
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

const getAllSessionsForAnalytics = async () => {
  if (supabaseStore.isSupabaseConfigured()) return supabaseStore.listSessions();
  if (global.useMemoryDB) return [...memorySessions];
  return Session.find().sort({ date: 1 });
};

const getAllPatientsForAnalytics = async () => {
  if (supabaseStore.isSupabaseConfigured()) return supabaseStore.listPatients();
  if (global.useMemoryDB) return [...memoryPatients];
  return Patient.find();
};

const mean = (values) => {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return 0;
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 100) / 100;
};

// Data science analysis endpoint for visual analytics
router.get('/analytics/clinical', async (req, res) => {
  try {
    const [sessions, patients] = await Promise.all([
      getAllSessionsForAnalytics(),
      getAllPatientsForAnalytics()
    ]);

    const patientMap = new Map(patients.map(patient => [patient.patientId, patient]));
    const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const byPatient = new Map();
    sorted.forEach(session => {
      if (!byPatient.has(session.patientId)) byPatient.set(session.patientId, []);
      byPatient.get(session.patientId).push(session);
    });

    const patientRiskRows = [...byPatient.entries()].map(([patientId, patientSessions]) => {
      const patient = patientMap.get(patientId) || { affectedSide: 'right', name: patientId };
      const latest = patientSessions[patientSessions.length - 1];
      const affectedKey = patient.affectedSide === 'left' ? 'leftHandQuality' : 'rightHandQuality';
      const unaffectedKey = patient.affectedSide === 'left' ? 'rightHandQuality' : 'leftHandQuality';
      const firstQuality = patientSessions[0]?.metrics?.[affectedKey] || 0;
      const latestQuality = latest?.metrics?.[affectedKey] || 0;
      const latestUnaffectedQuality = latest?.metrics?.[unaffectedKey] || 0;
      const qualityDelta = Math.round((latestQuality - firstQuality) * 100) / 100;
      const asymmetry = Math.max(0, latestUnaffectedQuality - latestQuality);
      const learnedRisk = latest?.metrics?.learnedNonUseRisk || 'undetermined';
      const riskBase = { high: 70, moderate: 45, low: 20, undetermined: 10 }[learnedRisk] || 10;
      const riskScore = Math.min(100, Math.round(
        riskBase +
        Math.max(0, -qualityDelta) * 1.2 +
        Math.max(0, asymmetry - 10) * 0.8 +
        Math.max(0, 35 - (latest?.metrics?.limbSelectionRatio || 0)) * 0.6
      ));

      return {
        patientId,
        name: patient.name,
        affectedSide: patient.affectedSide,
        sessionCount: patientSessions.length,
        latestDate: latest?.date,
        latestAffectedQuality: latestQuality,
        qualityDelta,
        asymmetry: Math.round(asymmetry * 100) / 100,
        limbSelectionRatio: latest?.metrics?.limbSelectionRatio || 0,
        cognitiveScore: latest?.metrics?.overallCognitiveScore ?? 100,
        learnedNonUseRisk: learnedRisk,
        riskScore
      };
    });

    const riskDistribution = patientRiskRows.reduce((acc, row) => {
      const bucket = row.riskScore >= 70 ? 'high' : row.riskScore >= 45 ? 'moderate' : row.riskScore >= 20 ? 'watchlist' : 'low';
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, { high: 0, moderate: 0, watchlist: 0, low: 0 });

    const modeCounts = sorted.reduce((acc, session) => {
      const mode = session.gameMode || 'unknown';
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {});

    const trendByDate = Object.values(sorted.reduce((acc, session) => {
      const dateKey = new Date(session.date).toISOString().slice(0, 10);
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, leftQuality: [], rightQuality: [], cognitive: [], limbSelection: [] };
      acc[dateKey].leftQuality.push(session.metrics?.leftHandQuality || 0);
      acc[dateKey].rightQuality.push(session.metrics?.rightHandQuality || 0);
      acc[dateKey].cognitive.push(session.metrics?.overallCognitiveScore ?? 100);
      acc[dateKey].limbSelection.push(session.metrics?.limbSelectionRatio || 0);
      return acc;
    }, {})).map(row => ({
      date: row.date,
      leftQuality: mean(row.leftQuality),
      rightQuality: mean(row.rightQuality),
      cognitiveScore: mean(row.cognitive),
      limbSelectionRatio: mean(row.limbSelection)
    }));

    res.json({
      generatedAt: new Date().toISOString(),
      storage: supabaseStore.isSupabaseConfigured() ? 'supabase' : (global.useMemoryDB ? 'memory' : 'mongodb'),
      totals: {
        patients: patients.length,
        sessions: sessions.length,
        highRiskPatients: riskDistribution.high,
        moderateRiskPatients: riskDistribution.moderate
      },
      riskDistribution,
      modeCounts,
      trendByDate,
      patientRiskRows: patientRiskRows.sort((a, b) => b.riskScore - a.riskScore)
    });
  } catch (error) {
    console.error('Failed to build clinical analytics:', error);
    res.status(500).json({ error: 'Failed to build clinical analytics', details: error.message });
  }
});

// Create a new patient
router.post('/patients', async (req, res) => {
  try {
    const { patientId, name, affectedSide, therapistEmail } = req.body;
    if (!patientId || !name || !affectedSide) {
      return res.status(400).json({ error: 'Missing patientId, name, or affectedSide' });
    }

    if (supabaseStore.isSupabaseConfigured()) {
      const patient = await supabaseStore.upsertPatient({
        patientId,
        name,
        affectedSide,
        therapistEmail: therapistEmail || 'therapist@neurodex.com'
      });
      res.status(201).json({ message: 'Patient saved successfully (Supabase)', patient });
    } else if (global.useMemoryDB) {
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
    if (supabaseStore.isSupabaseConfigured()) {
      const patients = await supabaseStore.listPatients();
      res.json(patients);
    } else if (global.useMemoryDB) {
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
