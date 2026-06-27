/**
 * Generates a full English Clinical Kinematics and Rehabilitation Report
 * formatted for high-quality PDF printing.
 */
export function generateEnglishReportHTML(patient, session, summary, detailedLogs = []) {
  const patientName = patient?.name || 'N/A';
  const patientId = patient?.patientId || 'N/A';
  const affectedSide = patient?.affectedSide ? patient.affectedSide.toUpperCase() : 'N/A';
  const dateStr = new Date(session?.date || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  
  // Format clinical metrics
  const lsr = session?.metrics?.limbSelectionRatio !== undefined ? `${session.metrics.limbSelectionRatio}%` : 'N/A';
  const lnuRisk = session?.metrics?.learnedNonUseRisk ? session.metrics.learnedNonUseRisk.toUpperCase() : 'UNDETERMINED';
  const lnuClass = `risk-${session?.metrics?.learnedNonUseRisk || 'undetermined'}`;
  
  const leftSpeed = session?.metrics?.leftHandSpeed !== undefined ? `${session.metrics.leftHandSpeed}%` : 'N/A';
  const leftAcc = session?.metrics?.leftHandAccuracy !== undefined ? `${session.metrics.leftHandAccuracy}%` : 'N/A';
  const leftQual = session?.metrics?.leftHandQuality !== undefined ? `${session.metrics.leftHandQuality}%` : 'N/A';
  
  const rightSpeed = session?.metrics?.rightHandSpeed !== undefined ? `${session.metrics.rightHandSpeed}%` : 'N/A';
  const rightAcc = session?.metrics?.rightHandAccuracy !== undefined ? `${session.metrics.rightHandAccuracy}%` : 'N/A';
  const rightQual = session?.metrics?.rightHandQuality !== undefined ? `${session.metrics.rightHandQuality}%` : 'N/A';
  
  const cognitiveScore = session?.metrics?.overallCognitiveScore !== undefined ? `${session.metrics.overallCognitiveScore}%` : 'N/A';
  
  // Detailed diagnostic averages
  const leftShoulderAngle = summary?.avgLeftShoulder !== undefined ? `${summary.avgLeftShoulder}°` : 'N/A';
  const rightShoulderAngle = summary?.avgRightShoulder !== undefined ? `${summary.avgRightShoulder}°` : 'N/A';
  const leftZDepth = summary?.avgLeftZ !== undefined ? `${summary.avgLeftZ} m` : 'N/A';
  const rightZDepth = summary?.avgRightZ !== undefined ? `${summary.avgRightZ} m` : 'N/A';
  
  const leftSpas = summary?.avgLeftSpas !== undefined ? `${summary.avgLeftSpas}%` : '0%';
  const leftSpasMax = summary?.leftSpasMax !== undefined ? `${summary.leftSpasMax}%` : '0%';
  const rightSpas = summary?.avgRightSpas !== undefined ? `${summary.avgRightSpas}%` : '0%';
  const rightSpasMax = summary?.rightSpasMax !== undefined ? `${summary.rightSpasMax}%` : '0%';
  const compensation = summary?.compPercentage !== undefined ? `${summary.compPercentage}%` : '0%';
  
  // Format English recommendations based on conditions
  let recommendationsList = [];
  if (summary?.recommendations) {
    // Translate/rephrase recommendations to clinical English
    const spasVal = patient?.affectedSide === 'left' ? summary.avgLeftSpas : summary.avgRightSpas;
    const lsrVal = session?.metrics?.limbSelectionRatio || 0;
    
    if (spasVal > 55) {
      recommendationsList.push("🚨 Detected clinical hand spasticity. Recommend consulting a physiatrist regarding antispastic medication and integrating low-velocity ROM stretches.");
    }
    if (lsrVal < 28 && spasVal < 45) {
      recommendationsList.push("💡 Limb Selection Ratio falls below 28% while capacity remains viable, indicating Learned Non-Use (LNU) behavior. Recommend starting Constraint-Induced Movement Therapy (CIMT).");
    }
    if (summary.compPercentage > 15) {
      recommendationsList.push("⚠️ High occurrence of compensatory shoulder/trunk tilting detected. Ensure the patient's torso is stabilized (e.g. high-back chair alignment) to prevent posture injury.");
    }
    if (recommendationsList.length === 0) {
      recommendationsList.push("✅ Kinematic motor control and posture remain satisfactory. Recommend continuing daily home tele-rehabilitation for 15-20 minutes.");
    }
  }

  // Create table rows from raw logs (limit to first 60 rows for print-friendliness)
  const logRows = detailedLogs.slice(0, 60).map((log, index) => {
    return `
      <tr>
        <td class="center">${index + 1}</td>
        <td class="center">${log.state}</td>
        <td class="center">${log.requiredHand}</td>
        <td class="center">${log.usedHand || 'none'}</td>
        <td class="right">${log.leftFingerX}, ${log.leftFingerY}, ${log.leftFingerZ || 0}</td>
        <td class="right">${log.rightFingerX}, ${log.rightFingerY}, ${log.rightFingerZ || 0}</td>
        <td class="center">${log.leftSpasticityScore || 0}% / ${log.rightSpasticityScore || 0}%</td>
        <td class="center">${log.leftShoulderAngle || '--'}° / ${log.rightShoulderAngle || '--'}°</td>
        <td class="center">${log.compensatoryMovement ? 'YES' : 'NO'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Clinical Kinematics & Rehabilitation Assessment Report</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 20px;
          line-height: 1.4;
          font-size: 11pt;
        }
        
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px double #0f172a;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        
        .brand-section h1 {
          margin: 0;
          font-size: 22pt;
          color: #0f172a;
          font-weight: 800;
        }
        
        .brand-section p {
          margin: 2px 0 0 0;
          font-size: 9.5pt;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        
        .report-meta {
          text-align: right;
          font-size: 9pt;
          color: #475569;
        }
        
        .patient-card {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background-color: #f8fafc;
        }
        
        .patient-card td, .patient-card th {
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          text-align: left;
        }
        
        .patient-card th {
          background-color: #f1f5f9;
          font-weight: 700;
          color: #334155;
          width: 25%;
        }
        
        .section-title {
          font-size: 13pt;
          color: #0f172a;
          border-bottom: 1.5px solid #94a3b8;
          padding-bottom: 4px;
          margin-top: 24px;
          margin-bottom: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .metric-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          background: #fff;
        }
        
        .metric-box h3 {
          margin: 0 0 10px 0;
          font-size: 11pt;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 9.5pt;
        }
        
        .metric-row .label {
          color: #475569;
        }
        
        .metric-row .value {
          font-weight: bold;
          color: #0f172a;
        }
        
        .risk-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8.5pt;
          font-weight: bold;
        }
        
        .risk-high { background: #fee2e2; color: #991b1b; }
        .risk-moderate { background: #fef3c7; color: #92400e; }
        .risk-low { background: #d1fae5; color: #065f46; }
        .risk-undetermined { background: #f1f5f9; color: #334155; }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
          margin-top: 10px;
        }
        
        .data-table th, .data-table td {
          border: 1px solid #e2e8f0;
          padding: 5px 6px;
        }
        
        .data-table th {
          background-color: #f8fafc;
          color: #334155;
          font-weight: bold;
        }
        
        .center { text-align: center; }
        .right { text-align: right; font-family: monospace; }
        
        .recommendation-box {
          border: 1.5px solid #d97706;
          border-radius: 6px;
          background-color: #fffbeb;
          padding: 12px 16px;
          margin-top: 20px;
        }
        
        .recommendation-box h4 {
          margin: 0 0 8px 0;
          color: #b45309;
          font-size: 11pt;
        }
        
        .recommendation-box ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .recommendation-box li {
          margin-bottom: 6px;
          font-size: 9.5pt;
        }
        
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        
        .sig-block {
          width: 40%;
          text-align: center;
          font-size: 9.5pt;
        }
        
        .sig-line {
          border-bottom: 1px solid #475569;
          height: 40px;
          margin-bottom: 6px;
        }
        
        @media print {
          body {
            padding: 0;
            background: #fff;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <!-- Print button for easy local triggers -->
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; font-weight: bold; background: #0f172a; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="report-header">
        <div class="brand-section">
          <h1>NEURODEX AI</h1>
          <p>Clinical Kinematic Rehabilitation & Assessment</p>
        </div>
        <div class="report-meta">
          <strong>Report ID:</strong> RPT-${session?.sessionId || 'N/A'}<br>
          <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-US')}<br>
          <strong>Format:</strong> Clinical Standard v1.2
        </div>
      </div>

      <!-- Patient Information -->
      <table class="patient-card">
        <tr>
          <th>Patient ID</th>
          <td>${patientId}</td>
          <th>Patient Name</th>
          <td>${patientName}</td>
        </tr>
        <tr>
          <th>Affected Hemiparesis Side</th>
          <td>${affectedSide} Side</td>
          <th>Assessment Timestamp</th>
          <td>${dateStr}</td>
        </tr>
        <tr>
          <th>Assessment Battery Mode</th>
          <td style="text-transform: capitalize;">${session?.gameMode || 'random'}</td>
          <th>Cognitive Filtering Score</th>
          <td>${cognitiveScore}</td>
        </tr>
      </table>

      <!-- Clinical Scores Section -->
      <div class="section-title">Clinical Kinematics & Motor Function Indicators</div>
      
      <div class="metrics-grid">
        <div class="metric-box">
          <h3>Left Upper Limb Performance (Left Hand)</h3>
          <div class="metric-row">
            <span class="label">Movement Velocity Score (Speed):</span>
            <span class="value">${leftSpeed}</span>
          </div>
          <div class="metric-row">
            <span class="label">Target Accuracy Score (Accuracy):</span>
            <span class="value">${leftAcc}</span>
          </div>
          <div class="metric-row">
            <span class="label">Trajectory Smoothness Score (Quality):</span>
            <span class="value">${leftQual}</span>
          </div>
          <div class="metric-row">
            <span class="label">Average Active ROM (Shoulder Extension):</span>
            <span class="value">${leftShoulderAngle}</span>
          </div>
          <div class="metric-row">
            <span class="label">Average Reach Depth (Z-Axis):</span>
            <span class="value">${leftZDepth}</span>
          </div>
        </div>

        <div class="metric-box">
          <h3>Right Upper Limb Performance (Right Hand)</h3>
          <div class="metric-row">
            <span class="label">Movement Velocity Score (Speed):</span>
            <span class="value">${rightSpeed}</span>
          </div>
          <div class="metric-row">
            <span class="label">Target Accuracy Score (Accuracy):</span>
            <span class="value">${rightAcc}</span>
          </div>
          <div class="metric-row">
            <span class="label">Trajectory Smoothness Score (Quality):</span>
            <span class="value">${rightQual}</span>
          </div>
          <div class="metric-row">
            <span class="label">Average Active ROM (Shoulder Extension):</span>
            <span class="value">${rightShoulderAngle}</span>
          </div>
          <div class="metric-row">
            <span class="label">Average Reach Depth (Z-Axis):</span>
            <span class="value">${rightZDepth}</span>
          </div>
        </div>
      </div>

      <!-- Spasticity & Behavior Section -->
      <div class="section-title">Spasticity, Compensation & Behavioral Profile</div>
      
      <div class="metrics-grid">
        <div class="metric-box">
          <h3>Behavioral Learned Non-Use Indicators</h3>
          <div class="metric-row">
            <span class="label">Limb Selection Ratio (LSR):</span>
            <span class="value">${lsr}</span>
          </div>
          <div class="metric-row">
            <span class="label">Learned Non-Use (LNU) Risk Level:</span>
            <span class="value">
              <span class="risk-badge ${lnuClass}">${lnuRisk}</span>
            </span>
          </div>
          <div class="metric-row">
            <span class="label">Postural Trunk Compensation (Tilt Rate):</span>
            <span class="value" style="color: ${summary?.compPercentage > 15 ? '#b91c1c' : '#047857'}">${compensation}</span>
          </div>
        </div>

        <div class="metric-box">
          <h3>Fist Clench & Spasticity Metrics (3D Joint Curl)</h3>
          <div class="metric-row">
            <span class="label">Left Hand Average Spasticity Index:</span>
            <span class="value">${leftSpas} (Max: ${leftSpasMax})</span>
          </div>
          <div class="metric-row">
            <span class="label">Right Hand Average Spasticity Index:</span>
            <span class="value">${rightSpas} (Max: ${rightSpasMax})</span>
          </div>
          <div class="metric-row">
            <span class="label">Clinical Evaluation Standard:</span>
            <span class="value">MAS Approximation Index</span>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendation-box">
        <h4>🩺 Clinical Assessment & Recommended Plan</h4>
        <ul>
          ${recommendationsList.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>

      <!-- Kinematics Time-Series -->
      <div class="section-title">Kinematics Time-Series Segment (First 60 Frames, 30Hz Sampling)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="2">Frame</th>
            <th rowspan="2">State</th>
            <th colspan="2">Hand Rules</th>
            <th colspan="2">End-Effector Coordinates (X, Y, Z)</th>
            <th rowspan="2">Spasticity (L/R)</th>
            <th rowspan="2">Shoulder AROM (L/R)</th>
            <th rowspan="2">Posture Lean</th>
          </tr>
          <tr>
            <th>Required</th>
            <th>Observed</th>
            <th>Left Hand</th>
            <th>Right Hand</th>
          </tr>
        </thead>
        <tbody>
          ${logRows}
        </tbody>
      </table>

      <!-- Signatures -->
      <div class="signature-section">
        <div class="sig-block">
          <div class="sig-line"></div>
          <strong>Attending Physical Therapist / Specialist</strong><br>
          Department of Physical Medicine & Rehabilitation
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <strong>Clinical Supervisor / MD</strong><br>
          Board of Neuro-Rehabilitation Diagnostics
        </div>
      </div>
    </body>
    </html>
  `;
}
