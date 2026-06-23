import { MedicalAssessmentEngine } from './MedicalAssessmentEngine.js';
import { AlertService } from './alertService.js';

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`PASS: ${label}`);
};

const createTrialLogs = ({
  handUsed = 'left',
  isCorrectTarget = true,
  isHit = true,
  requiredHand = 'any',
  startTime = 1000,
  targetX = 220,
  targetY = 160
}) => {
  const resting = {
    targetX: 0,
    targetY: 0,
    targetShape: 'none',
    targetColor: 'none',
    isCorrectTarget: true,
    requiredHand,
    leftFingerX: 300,
    leftFingerY: 420,
    rightFingerX: 500,
    rightFingerY: 420,
    usedHand: 'none',
    state: 'resting'
  };

  const targetBase = {
    targetX,
    targetY,
    targetShape: 'circle',
    targetColor: 'red',
    isCorrectTarget,
    requiredHand
  };

  const logs = [
    { ...resting, timestamp: startTime - 500 },
    { ...resting, ...targetBase, timestamp: startTime }
  ];

  const finalState = isHit ? 'hit' : 'miss';
  const finalUsedHand = isHit ? handUsed : 'none';

  logs.push({
    ...targetBase,
    timestamp: startTime + 300,
    leftFingerX: handUsed === 'left' ? 270 : 300,
    leftFingerY: handUsed === 'left' ? 330 : 420,
    rightFingerX: handUsed === 'right' ? 470 : 500,
    rightFingerY: handUsed === 'right' ? 330 : 420,
    usedHand: 'none',
    state: 'moving'
  });

  logs.push({
    ...targetBase,
    timestamp: startTime + 600,
    leftFingerX: handUsed === 'left' ? targetX : 300,
    leftFingerY: handUsed === 'left' ? targetY : 420,
    rightFingerX: handUsed === 'right' ? targetX : 500,
    rightFingerY: handUsed === 'right' ? targetY : 420,
    usedHand: finalUsedHand,
    state: finalState
  });

  return logs;
};

console.log('--- RUNNING RIT ENGINE REGRESSION TESTS ---');

const cognitiveLogs = [
  ...createTrialLogs({ handUsed: 'left', isCorrectTarget: true, isHit: true, startTime: 1000 }),
  ...createTrialLogs({ handUsed: 'left', isCorrectTarget: true, isHit: false, startTime: 3000 }),
  ...createTrialLogs({ handUsed: 'left', isCorrectTarget: false, isHit: true, startTime: 5000 })
];
const cognitiveResult = MedicalAssessmentEngine.analyze(cognitiveLogs, { affectedSide: 'left' });
assertEqual(cognitiveResult.overallCognitiveScore, 80, 'cognitive commission and omission scoring');

const leftSelectionLogs = [
  ...createTrialLogs({ handUsed: 'left', startTime: 1000 }),
  ...createTrialLogs({ handUsed: 'right', startTime: 3000 })
];
const leftSelection = MedicalAssessmentEngine.analyze(leftSelectionLogs, { affectedSide: 'left' });
assertEqual(leftSelection.limbSelectionRatio, 50, 'affected left limb selection ratio');

const rightSelection = MedicalAssessmentEngine.analyze(leftSelectionLogs, { affectedSide: 'right' });
assertEqual(rightSelection.limbSelectionRatio, 50, 'affected right limb selection ratio');

const forcedWrongHandLogs = createTrialLogs({
  handUsed: 'right',
  isCorrectTarget: true,
  isHit: true,
  requiredHand: 'left'
});
const forcedWrongHand = MedicalAssessmentEngine.analyze(forcedWrongHandLogs, { affectedSide: 'left' });
assertEqual(forcedWrongHand.overallCognitiveScore, 85, 'forced-mode wrong hand counts as commission');
assertEqual(forcedWrongHand.rightHand.accuracy, 0, 'forced-mode wrong hand does not inflate motor accuracy');

const alertPatient = {
  patientId: 'PT-ALERT',
  name: 'Alert Test',
  affectedSide: 'left',
  therapistEmail: 'custom.therapist@example.com'
};
const alertSessions = [
  { patientId: 'PT-ALERT', sessionId: 'S1', date: '2026-01-01T00:00:00.000Z', metrics: { leftHandQuality: 90 } },
  { patientId: 'PT-ALERT', sessionId: 'S2', date: '2026-01-02T00:00:00.000Z', metrics: { leftHandQuality: 80 } },
  { patientId: 'PT-ALERT', sessionId: 'S3', date: '2026-01-03T00:00:00.000Z', metrics: { leftHandQuality: 70 } }
];
const alertResult = AlertService.checkAndSendAlert(alertPatient, alertSessions);
assertEqual(alertResult?.recipient, 'custom.therapist@example.com', 'alert uses persisted therapist email');

console.log('--- ALL RIT ENGINE REGRESSION TESTS PASSED ---');
