const safe = (value, fallback = '') => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return value;
};

const number = (value, digits = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(digits));
};

const csvCell = (value) => {
  const text = String(safe(value, ''));
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadTextFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

const modeName = (mode) => ({
  random: 'Random reach selection',
  forced: 'Forced affected-side reaching',
  bilateral: 'Bilateral coordination',
  range_of_motion: 'Shoulder range of motion',
  cognitive_match: 'Cognitive target matching',
  diagnostic: 'Clinical diagnostics'
}[mode] || 'Unspecified');

const riskName = (risk) => ({
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  undetermined: 'Undetermined'
}[risk] || 'Undetermined');

const handName = (hand) => ({
  left: 'Left',
  right: 'Right',
  both: 'Bilateral',
  balanced: 'Balanced',
  none: 'None',
  any: 'Any',
  undetermined: 'Undetermined'
}[hand] || 'Undetermined');

export const physicalTherapyTerminology = [
  ['Reaction Time (RT)', 'Time from target presentation to movement onset, reported in milliseconds.'],
  ['Movement Time (MT)', 'Time from movement onset to endpoint contact or trial resolution.'],
  ['Endpoint Precision Error', 'Euclidean distance between the fingertip endpoint and target center, reported in pixels.'],
  ['Path Smoothness Index', 'Movement path length divided by the straight-line path. Values closer to 1.00 indicate smoother movement.'],
  ['Resting Jitter', 'Variability of the fingertip during rest phases, used as a proxy for tremor or poor postural control.'],
  ['Active Range of Motion (AROM)', 'Observed active shoulder angle during voluntary reaching.'],
  ['Compensatory Movement', 'Trunk lean, shoulder hiking, or postural substitution used to complete a reaching task.'],
  ['Spasticity Screening Score', 'Markerless hand-posture score estimating excessive flexor tone or reduced finger extension.'],
  ['Learned Non-Use', 'Behavioral underuse of the affected limb despite available motor capacity.'],
  ['Limb Selection Ratio', 'Percentage of random-choice trials completed with the affected limb.'],
  ['Cognitive Filtering Score', 'Accuracy of following target rules while avoiding distractors.'],
  ['Bilateral Coordination', 'Ability to coordinate both upper limbs during simultaneous reaching.']
];

export const buildSessionReportRows = (sessions, patients = []) => {
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const previousByPatient = new Map();

  return sorted.map((session, index) => {
    const patient = patients.find(p => p.patientId === session.patientId) || {};
    const affectedSide = patient.affectedSide || 'right';
    const metrics = session.metrics || {};
    const detailed = session.detailed || {};
    const diagnostic = session.diagnosticSummary || {};
    const previous = previousByPatient.get(session.patientId);
    const affectedQualityKey = affectedSide === 'left' ? 'leftHandQuality' : 'rightHandQuality';
    const affectedSpeedKey = affectedSide === 'left' ? 'leftHandSpeed' : 'rightHandSpeed';
    const affectedAccuracyKey = affectedSide === 'left' ? 'leftHandAccuracy' : 'rightHandAccuracy';

    const row = {
      roundNumber: index + 1,
      sessionId: session.sessionId,
      patientId: session.patientId,
      patientName: patient.name || '',
      assessmentDate: formatDateTime(session.date),
      assessmentMode: modeName(session.gameMode),
      affectedSide: handName(affectedSide),
      leftSpeedScore: metrics.leftHandSpeed || 0,
      leftAccuracyScore: metrics.leftHandAccuracy || 0,
      leftQualityScore: metrics.leftHandQuality || 0,
      rightSpeedScore: metrics.rightHandSpeed || 0,
      rightAccuracyScore: metrics.rightHandAccuracy || 0,
      rightQualityScore: metrics.rightHandQuality || 0,
      affectedLimbSpeedScore: metrics[affectedSpeedKey] || 0,
      affectedLimbAccuracyScore: metrics[affectedAccuracyKey] || 0,
      affectedLimbQualityScore: metrics[affectedQualityKey] || 0,
      affectedLimbQualityDelta: previous ? number((metrics[affectedQualityKey] || 0) - (previous.metrics?.[affectedQualityKey] || 0), 1) : 0,
      limbSelectionRatio: metrics.limbSelectionRatio || 0,
      learnedNonUseRisk: riskName(metrics.learnedNonUseRisk),
      predictedDominantHand: handName(metrics.predictedDominantHand),
      cognitiveFilteringScore: metrics.overallCognitiveScore ?? 100,
      leftReactionTimeMs: detailed.left?.RT || 0,
      rightReactionTimeMs: detailed.right?.RT || 0,
      leftMovementTimeMs: detailed.left?.MT || 0,
      rightMovementTimeMs: detailed.right?.MT || 0,
      leftEndpointPrecisionPx: detailed.left?.error || 0,
      rightEndpointPrecisionPx: detailed.right?.error || 0,
      leftRestingJitterPx: detailed.left?.jitter || 0,
      rightRestingJitterPx: detailed.right?.jitter || 0,
      leftPathSmoothnessIndex: detailed.left?.smoothness || 1,
      rightPathSmoothnessIndex: detailed.right?.smoothness || 1,
      leftShoulderAromDeg: diagnostic.avgLeftShoulder || 0,
      rightShoulderAromDeg: diagnostic.avgRightShoulder || 0,
      leftSpasticityMeanScore: diagnostic.avgLeftSpas || 0,
      rightSpasticityMeanScore: diagnostic.avgRightSpas || 0,
      compensatoryMovementPercent: diagnostic.compPercentage || 0,
      rawFrameCount: session.rawLogs?.length || 0
    };

    previousByPatient.set(session.patientId, session);
    return row;
  });
};

export const exportSessionsCsv = (sessions, patients = []) => {
  const rows = buildSessionReportRows(sessions, patients);
  const headers = [
    'roundNumber',
    'sessionId',
    'patientId',
    'patientName',
    'assessmentDate',
    'assessmentMode',
    'affectedSide',
    'leftSpeedScore',
    'leftAccuracyScore',
    'leftQualityScore',
    'rightSpeedScore',
    'rightAccuracyScore',
    'rightQualityScore',
    'affectedLimbSpeedScore',
    'affectedLimbAccuracyScore',
    'affectedLimbQualityScore',
    'affectedLimbQualityDelta',
    'limbSelectionRatio',
    'learnedNonUseRisk',
    'predictedDominantHand',
    'cognitiveFilteringScore',
    'leftReactionTimeMs',
    'rightReactionTimeMs',
    'leftMovementTimeMs',
    'rightMovementTimeMs',
    'leftEndpointPrecisionPx',
    'rightEndpointPrecisionPx',
    'leftRestingJitterPx',
    'rightRestingJitterPx',
    'leftPathSmoothnessIndex',
    'rightPathSmoothnessIndex',
    'leftShoulderAromDeg',
    'rightShoulderAromDeg',
    'leftSpasticityMeanScore',
    'rightSpasticityMeanScore',
    'compensatoryMovementPercent',
    'rawFrameCount'
  ];

  const csv = [
    headers.map(csvCell).join(','),
    ...rows.map(row => headers.map(header => csvCell(row[header])).join(','))
  ].join('\n');

  const patientPart = sessions.length === 1 ? sessions[0].patientId : 'cohort';
  downloadTextFile(`RIT-clinical-summary-${patientPart}-${Date.now()}.csv`, csv, 'text/csv');
};

export const exportRawFrameCsv = (session) => {
  const rawLogs = session.rawLogs || [];
  const headers = [
    'sessionId',
    'patientId',
    'timestamp',
    'state',
    'targetX',
    'targetY',
    'targetShape',
    'targetColor',
    'isCorrectTarget',
    'requiredHand',
    'usedHand',
    'leftFingerX',
    'leftFingerY',
    'leftFingerZ',
    'rightFingerX',
    'rightFingerY',
    'rightFingerZ',
    'leftSpasticityScore',
    'rightSpasticityScore',
    'leftShoulderAngle',
    'rightShoulderAngle',
    'compensatoryMovement'
  ];

  const rows = rawLogs.map(log => ({
    sessionId: session.sessionId,
    patientId: session.patientId,
    ...log
  }));

  const csv = [
    headers.map(csvCell).join(','),
    ...rows.map(row => headers.map(header => csvCell(row[header])).join(','))
  ].join('\n');

  downloadTextFile(`RIT-raw-frame-data-${session.patientId}-${session.sessionId}.csv`, csv, 'text/csv');
};

const trendSvg = (rows) => {
  const width = 760;
  const height = 260;
  const pad = 44;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const points = rows.map((row, i) => ({
    x: pad + (rows.length <= 1 ? plotW / 2 : (i / (rows.length - 1)) * plotW),
    y: pad + plotH - ((row.affectedLimbQualityScore || 0) / 100) * plotH,
    value: row.affectedLimbQualityScore || 0
  }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Affected limb quality trend chart">
      <rect width="${width}" height="${height}" fill="#f8fafc" stroke="#cbd5e1"/>
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#64748b"/>
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#64748b"/>
      <text x="${pad}" y="24" font-size="13" font-weight="700" fill="#0f172a">Affected Limb Quality Trend (%)</text>
      <text x="8" y="${pad + 4}" font-size="10" fill="#64748b">100</text>
      <text x="14" y="${height - pad + 4}" font-size="10" fill="#64748b">0</text>
      <polyline points="${polyline}" fill="none" stroke="#2563eb" stroke-width="3"/>
      ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#2563eb"/><text x="${p.x - 10}" y="${p.y - 10}" font-size="10" fill="#0f172a">R${i + 1}: ${p.value}</text>`).join('')}
    </svg>
  `;
};

const recommendations = (latestRow) => {
  const items = [];
  if (!latestRow) return ['No session data is available for clinical interpretation.'];
  if (latestRow.learnedNonUseRisk === 'High') {
    items.push('High learned non-use risk: consider task-specific affected-limb practice and clinician-supervised constraint-induced movement therapy when clinically appropriate.');
  }
  if (latestRow.compensatoryMovementPercent > 15) {
    items.push('Compensatory movement is elevated: review trunk alignment, seating support, shoulder hiking, and task distance before increasing task difficulty.');
  }
  if (latestRow.affectedLimbQualityDelta < -5) {
    items.push('Affected-limb quality declined compared with the previous round: review fatigue, pain, tone, attention, and medication timing.');
  }
  if (latestRow.leftSpasticityMeanScore > 55 || latestRow.rightSpasticityMeanScore > 55) {
    items.push('Spasticity screening score is elevated: consider formal tone assessment and upper-limb stretching or tone-management planning.');
  }
  if (items.length === 0) {
    items.push('No major deterioration flag was detected. Continue progressive, task-oriented upper-limb rehabilitation and compare against future sessions.');
  }
  return items;
};

export const exportPrintablePdfReport = (sessions, patients = []) => {
  const rows = buildSessionReportRows(sessions, patients);
  const latest = rows[rows.length - 1];
  const patient = latest ? patients.find(p => p.patientId === latest.patientId) || {} : {};
  const terminologyRows = physicalTherapyTerminology
    .map(([term, definition]) => `<tr><td>${term}</td><td>${definition}</td></tr>`)
    .join('');
  const sessionRows = rows.map(row => `
    <tr>
      <td>${row.roundNumber}</td>
      <td>${row.assessmentDate}</td>
      <td>${row.assessmentMode}</td>
      <td>${row.affectedLimbQualityScore}</td>
      <td>${row.affectedLimbQualityDelta}</td>
      <td>${row.limbSelectionRatio}</td>
      <td>${row.learnedNonUseRisk}</td>
      <td>${row.cognitiveFilteringScore}</td>
    </tr>
  `).join('');
  const detailRows = rows.map(row => `
    <tr>
      <td>${row.roundNumber}</td>
      <td>${row.leftReactionTimeMs}</td>
      <td>${row.rightReactionTimeMs}</td>
      <td>${row.leftMovementTimeMs}</td>
      <td>${row.rightMovementTimeMs}</td>
      <td>${row.leftEndpointPrecisionPx}</td>
      <td>${row.rightEndpointPrecisionPx}</td>
      <td>${row.leftPathSmoothnessIndex}</td>
      <td>${row.rightPathSmoothnessIndex}</td>
      <td>${row.compensatoryMovementPercent}</td>
    </tr>
  `).join('');
  const recRows = recommendations(latest).map(item => `<li>${item}</li>`).join('');

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>RIT Clinical Assessment Report</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.35; }
    h1, h2, h3 { margin: 0 0 8px; }
    h1 { font-size: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
    h2 { font-size: 17px; margin-top: 22px; color: #1d4ed8; }
    p, li { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
    th { background: #e2e8f0; text-align: left; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; margin: 12px 0; font-size: 12px; }
    .note { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; font-size: 12px; }
    .chart { margin: 12px 0; }
  </style>
</head>
<body>
  <h1>Reaching Interception Test Clinical Assessment Report</h1>
  <div class="meta">
    <div><strong>Patient ID:</strong> ${latest?.patientId || ''}</div>
    <div><strong>Patient Name:</strong> ${patient.name || latest?.patientName || ''}</div>
    <div><strong>Affected Side:</strong> ${latest?.affectedSide || ''}</div>
    <div><strong>Report Generated:</strong> ${new Date().toISOString()}</div>
    <div><strong>Total Assessment Rounds:</strong> ${rows.length}</div>
    <div><strong>Latest Learned Non-Use Risk:</strong> ${latest?.learnedNonUseRisk || 'Undetermined'}</div>
  </div>

  <div class="note">
    This document summarizes markerless upper-limb kinematic screening data collected with the Reaching Interception Test. It is intended as a clinical reference for physical therapists and physicians. It does not replace a formal neurological, orthopedic, or rehabilitation medicine examination.
  </div>

  <h2>Clinical Executive Summary</h2>
  <p>
    Latest affected-limb quality score: <strong>${latest?.affectedLimbQualityScore ?? 0}%</strong>.
    Round-to-round quality change: <strong>${latest?.affectedLimbQualityDelta ?? 0}</strong> percentage points.
    Limb selection ratio: <strong>${latest?.limbSelectionRatio ?? 0}%</strong>.
    Cognitive filtering score: <strong>${latest?.cognitiveFilteringScore ?? 100}%</strong>.
  </p>
  <ul>${recRows}</ul>

  <h2>Round-by-Round Change Table</h2>
  <table>
    <thead><tr><th>Round</th><th>Date</th><th>Mode</th><th>Affected Limb Quality</th><th>Delta</th><th>Limb Selection Ratio</th><th>Learned Non-Use Risk</th><th>Cognitive Score</th></tr></thead>
    <tbody>${sessionRows}</tbody>
  </table>

  <h2>Graphical Trend</h2>
  <div class="chart">${trendSvg(rows)}</div>

  <h2>Detailed Kinematic Metrics</h2>
  <table>
    <thead><tr><th>Round</th><th>Left RT ms</th><th>Right RT ms</th><th>Left MT ms</th><th>Right MT ms</th><th>Left Precision px</th><th>Right Precision px</th><th>Left Smoothness</th><th>Right Smoothness</th><th>Compensation %</th></tr></thead>
    <tbody>${detailRows}</tbody>
  </table>

  <h2>Physical Therapy Terminology Reference</h2>
  <table>
    <thead><tr><th>Term</th><th>Clinical Meaning</th></tr></thead>
    <tbody>${terminologyRows}</tbody>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
};
