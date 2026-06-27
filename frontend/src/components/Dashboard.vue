<template>
  <div class="dashboard-container glass-panel">
    <div class="dashboard-header">
      <div>
        <h2>การวิเคราะห์และประเมินความก้าวหน้าผู้ป่วย</h2>
        <p class="subtitle">แดชบอร์ดข้อมูลทางคลินิกแสดงแนวโน้มจลนศาสตร์เปรียบเทียบประสิทธิภาพ มือซ้าย vs มือขวา</p>
      </div>
      <div class="patient-selector-container">
        <label for="patient-filter">เลือกผู้ป่วย:</label>
        <select id="patient-filter" v-model="selectedPatientId" class="form-input select-input" @change="fetchPatientData">
          <option value="">-- ผู้ป่วยทั้งหมด --</option>
          <option v-for="patient in patients" :key="patient.patientId" :value="patient.patientId">
            {{ patient.name }} ({{ patient.patientId }}) - ข้างที่อ่อนแรง: {{ patient.affectedSide === 'left' ? 'ซ้าย' : 'ขวา' }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="dashboardError" class="dashboard-error glass-panel">
      {{ dashboardError }}
    </div>

    <!-- Alert / Deterioration Banner -->
    <div v-if="clinicalAlert" class="clinical-alert-banner glass-panel">
      <div class="alert-header">
        <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <h3>⚠️ คำเตือนทางคลินิก: ตรวจพบคุณภาพการเคลื่อนไหวลดลงอย่างต่อเนื่อง</h3>
      </div>
      <p>
        ระบบประมวลผลทางคลินิกตรวจพบว่า คุณภาพการเคลื่อนไหวของมือข้างอ่อนแรง (ซีก<strong>{{ clinicalAlert.affectedSide === 'left' ? 'ซ้าย' : 'ขวา' }}</strong>) ของผู้ป่วยรายนี้ลดลงอย่างต่อเนื่องใน 3 เซสชันการทดสอบล่าสุด
      </p>
      <p class="alert-details">
        คะแนนคุณภาพตามลำดับเวลา: {{ clinicalAlert.scores.join('% → ') }}% (ล่าสุด) ส่งอีเมลรายงานประเมินไปยังนักกายภาพบำบัดแล้วที่ {{ clinicalAlert.email }}
      </p>
    </div>

    <!-- Empty State -->
    <div v-if="sessions.length === 0" class="empty-state">
      <p>ยังไม่พบประวัติเซสชันการประเมิน กรุณาบันทึกประเมินผลการทดสอบ RIT ให้สำเร็จเพื่อคำนวณสถิติ</p>
    </div>

    <!-- Active Dashboard -->
    <div v-else class="dashboard-grid">
      
      <!-- side-by-side stats -->
      <div class="comparison-cards">
        <div class="hand-card glass-panel prediction-card">
          <h3>ผลทำนายความถนัด</h3>
          <div class="selection-value">
            <span class="percent">{{ formatDominantHand(predictedDominantHand) }}</span>
            <span class="desc">จาก Speed, Accuracy, Quality และพฤติกรรมการเลือกใช้มือ</span>
          </div>
          <div class="metric-row">
            <span class="label">คะแนนมือซ้าย</span>
            <span class="value">{{ avgLeftDominance }}%</span>
          </div>
          <div class="metric-row">
            <span class="label">คะแนนมือขวา</span>
            <span class="value">{{ avgRightDominance }}%</span>
          </div>
        </div>

        <div class="hand-card glass-panel risk-card" :class="`risk-${learnedNonUseRisk}`">
          <h3>ความเสี่ยง Learned Non-Use</h3>
          <div class="selection-value">
            <span class="percent">{{ formatRisk(learnedNonUseRisk) }}</span>
            <span class="desc">ดูจากความสามารถของแขนข้างอ่อนแรงเทียบกับความถี่ที่ถูกเลือกใช้จริง</span>
          </div>
          <p class="explanation">
            ถ้าแขนข้างอ่อนแรงยังทำงานได้พอสมควร แต่ผู้ใช้เลือกใช้น้อยมาก ระบบจะตีความว่าอาจมีการเลี่ยงใช้หรือ "ลืมใช้" แขนข้างนั้น
          </p>
        </div>

        <!-- Left Hand -->
        <div class="hand-card glass-panel left-hand">
          <h3>ประสิทธิภาพ มือซ้าย</h3>
          <div class="metric-row">
            <span class="label">คะแนนความเร็ว (Speed)</span>
            <span class="value">{{ leftSpeed }}%</span>
          </div>
          <div class="metric-row">
            <span class="label">คะแนนความแม่นยำ (Accuracy)</span>
            <span class="value">{{ leftAccuracy }}%</span>
          </div>
          <div class="metric-row">
            <span class="label">คะแนนคุณภาพ (Quality)</span>
            <span class="value">{{ leftQuality }}%</span>
          </div>
        </div>

        <!-- Right Hand -->
        <div class="hand-card glass-panel right-hand">
          <h3>ประสิทธิภาพ มือขวา</h3>
          <div class="metric-row">
            <span class="label">คะแนนความเร็ว (Speed)</span>
            <span class="value">{{ rightSpeed }}%</span>
          </div>
          <div class="metric-row">
            <span class="label">คะแนนความแม่นยำ (Accuracy)</span>
            <span class="value">{{ rightAccuracy }}%</span>
          </div>
          <div class="metric-row">
            <span class="label">คะแนนคุณภาพ (Quality)</span>
            <span class="value">{{ rightQuality }}%</span>
          </div>
        </div>

        <!-- Limb Selection Ratio (Learned Non-Use indicator) -->
        <div class="hand-card glass-panel limb-selection">
          <h3>การเลือกใช้งานมือ</h3>
          <div class="selection-value">
            <span class="percent">{{ avgLimbSelection }}%</span>
            <span class="desc">อัตราการเลือกใช้มือข้างอ่อนแรงในโหมดสุ่ม</span>
          </div>
          <p class="explanation">
            หากสัดส่วนการเอื้อมสกัดกั้นเป้าหมายด้วยมือข้างที่อ่อนแรงต่ำ แสดงให้เห็นว่าผู้ป่วยเลี่ยงการเคลื่อนไหวมือที่มีปัญหา (Learned Non-Use) ในชีวิตประจำวัน
          </p>
        </div>

        <!-- Cognitive Score -->
        <div class="hand-card glass-panel cognitive-score">
          <h3>คะแนนการรู้คิดและคัดกรอง</h3>
          <div class="selection-value">
            <span class="percent">{{ avgCognitiveScore }}%</span>
            <span class="desc">ความถูกต้องเชิงตรรกะและการกรองเป้าหมาย</span>
          </div>
          <p class="explanation">
            คะแนนสะท้อนความแม่นยำในการเลือกสกัดกั้นวัตถุเป้าหมายตามกฎ (Cognitive Filtering) โดยหักคะแนนเมื่อสกัดกั้นเป้าหมายผิดกฎ (Commission) หรือละเลยเป้าหมายที่ถูกกฎ (Omission)
          </p>
        </div>

        <!-- Detailed Kinematics Comparison Card -->
        <div class="hand-card glass-panel detailed-kinematics-card">
          <h3 style="color: #2dd4bf;">ค่าวัดจลนศาสตร์เชิงฟิสิกส์เฉลี่ย (Physical Kinematics)</h3>
          <div class="kinematics-comparison-grid">
            <div class="kinematics-header-row">
              <span class="col-title">ตัวชี้วัดจลนศาสตร์</span>
              <span class="col-title text-indigo">มือซ้าย</span>
              <span class="col-title text-pink">มือขวา</span>
            </div>
            <div class="kinematics-data-row">
              <span class="label">Reaction Time (เวลาตอบสนองสั่งการ)</span>
              <span class="value">{{ avgLeftRT }} ms</span>
              <span class="value">{{ avgRightRT }} ms</span>
            </div>
            <div class="kinematics-data-row">
              <span class="label">Movement Time (เวลาเอื้อมพิกัด)</span>
              <span class="value">{{ avgLeftMT }} ms</span>
              <span class="value">{{ avgRightMT }} ms</span>
            </div>
            <div class="kinematics-data-row">
              <span class="label">Endpoint Precision (ความเบี่ยงเบนเป้าหมาย)</span>
              <span class="value">{{ avgLeftPrecision }} px</span>
              <span class="value">{{ avgRightPrecision }} px</span>
            </div>
            <div class="kinematics-data-row">
              <span class="label">Resting Jitter (อาการสั่นขณะพัก)</span>
              <span class="value">{{ avgLeftJitterVal }} px</span>
              <span class="value">{{ avgRightJitterVal }} px</span>
            </div>
            <div class="kinematics-data-row">
              <span class="label">Path Smoothness (ความราบเรียบของแนวแรง)</span>
              <span class="value">{{ avgLeftSmoothnessVal }}x</span>
              <span class="value">{{ avgRightSmoothnessVal }}x</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Kinematics Trends Chart -->
      <div class="chart-section glass-panel">
        <h3>แนวโน้มคุณภาพการเคลื่อนไหว (มือซ้าย vs มือขวา)</h3>
        <p class="chart-subtitle">การวิเคราะห์คะแนนคุณภาพการเคลื่อนไหวตามช่วงเวลา ระบบจะแสดงคำเตือนทางคลินิกเมื่อพบแนวโน้มที่คะแนนลดลงอย่างต่อเนื่อง</p>
        <div class="chart-wrapper">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <!-- Session to Session Progress Trends (Round to Round delta changes) -->
      <div v-if="sessionTrends && sessionTrends.length > 0" class="history-section glass-panel" style="margin-bottom: 20px;">
        <h3>📈 ตารางสรุปการเปลี่ยนแปลงและแนวโน้มกายภาพบำบัดรายเซสชัน (Session-to-Session PT Progress Trends)</h3>
        <p class="chart-subtitle" style="margin-bottom: 12px;">วิเคราะห์ความแตกต่างของค่าจลนศาสตร์และขีดความสามารถการฟื้นตัวของกล้ามเนื้อประสาท เปรียบเทียบผลลัพธ์รอบต่อรอบ (Round-to-Round Delta)</p>
        <div class="table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>เปรียบเทียบรอบเซสชัน (Sessions)</th>
                <th>องศาข้อไหล่ซ้าย (AROM Delta Left)</th>
                <th>องศาข้อไหล่ขวา (AROM Delta Right)</th>
                <th>ความตึงเกร็งมือซ้าย (Spasticity Delta Left)</th>
                <th>ความตึงเกร็งมือขวา (Spasticity Delta Right)</th>
                <th>การเลือกใช้มือข้างอ่อนแรง (LSR Delta)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(trend, tIdx) in sessionTrends" :key="tIdx">
                <td style="font-size: 0.85rem; font-weight: 700; color: #38bdf8;">
                  เซสชันล่าสุด vs เซสชันก่อนหน้า
                  <div style="font-size: 0.7rem; color: #94a3b8; font-weight: normal; margin-top: 2px;">
                    (ID: {{ trend.sessionId.substring(0, 8) }}... vs {{ trend.prevSessionId.substring(0, 8) }}...)
                  </div>
                </td>
                <td class="center" :style="{ color: trend.leftROMDiff > 0 ? '#34d399' : (trend.leftROMDiff < 0 ? '#ef4444' : '#94a3b8') }">
                  {{ trend.leftROMDiff > 0 ? '+' : '' }}{{ trend.leftROMDiff }}°
                </td>
                <td class="center" :style="{ color: trend.rightROMDiff > 0 ? '#34d399' : (trend.rightROMDiff < 0 ? '#ef4444' : '#94a3b8') }">
                  {{ trend.rightROMDiff > 0 ? '+' : '' }}{{ trend.rightROMDiff }}°
                </td>
                <td class="center" :style="{ color: trend.leftSpasDiff < 0 ? '#34d399' : (trend.leftSpasDiff > 0 ? '#ef4444' : '#94a3b8') }">
                  {{ trend.leftSpasDiff > 0 ? '+' : '' }}{{ trend.leftSpasDiff }}%
                </td>
                <td class="center" :style="{ color: trend.rightSpasDiff < 0 ? '#34d399' : (trend.rightSpasDiff > 0 ? '#ef4444' : '#94a3b8') }">
                  {{ trend.rightSpasDiff > 0 ? '+' : '' }}{{ trend.rightSpasDiff }}%
                </td>
                <td class="center" :style="{ color: trend.selectionRatioDiff > 0 ? '#34d399' : (trend.selectionRatioDiff < 0 ? '#ef4444' : '#94a3b8') }">
                  {{ trend.selectionRatioDiff > 0 ? '+' : '' }}{{ trend.selectionRatioDiff }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- History Table -->
      <div class="history-section glass-panel">
        <h3>ประวัติบันทึกเซสชัน</h3>
        <div class="table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>วัน / เวลา</th>
                <th>รหัสเซสชัน</th>
                <th>รหัสผู้ป่วย</th>
                <th>โหมดการทดสอบ</th>
                <th>มือซ้าย (เร็ว/แม่น/คุณภาพ)</th>
                <th>มือขวา (เร็ว/แม่น/คุณภาพ)</th>
                <th>การเลือกใช้มือข้างอ่อนแรง</th>
                <th>ผลทำนาย</th>
                <th>Learned Non-Use</th>
                <th>คะแนนการรู้คิด</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="sess in analyzedSessions" :key="sess.sessionId">
                <tr class="clickable-row" @click="toggleExpandSession(sess.sessionId)" style="cursor: pointer;">
                  <td>{{ formatDate(sess.date) }}</td>
                  <td class="font-mono text-xs">{{ sess.sessionId }}</td>
                  <td>{{ sess.patientId }}</td>
                  <td>
                    <span class="badge mode-badge">
                      {{ sess.gameMode === 'random' ? 'โหมดสุ่ม' : (sess.gameMode === 'forced' ? 'โหมดบังคับ' : (sess.gameMode === 'bilateral' ? 'สองมือ' : (sess.gameMode === 'range_of_motion' ? 'ข้อไหล่' : (sess.gameMode === 'diagnostic' ? 'วินิจฉัยเชิงลึก' : 'สลับสี')))) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge speed-badge">{{ sess.metrics.leftHandSpeed }}%</span>
                    <span class="badge accuracy-badge">{{ sess.metrics.leftHandAccuracy }}%</span>
                    <span class="badge quality-badge">{{ sess.metrics.leftHandQuality }}%</span>
                  </td>
                  <td>
                    <span class="badge speed-badge">{{ sess.metrics.rightHandSpeed }}%</span>
                    <span class="badge accuracy-badge">{{ sess.metrics.rightHandAccuracy }}%</span>
                    <span class="badge quality-badge">{{ sess.metrics.rightHandQuality }}%</span>
                  </td>
                  <td class="score-cell">{{ sess.metrics.limbSelectionRatio }}%</td>
                  <td>{{ formatDominantHand(sess.metrics.predictedDominantHand || 'undetermined') }}</td>
                  <td><span class="badge risk-badge">{{ formatRisk(sess.metrics.learnedNonUseRisk || 'undetermined') }}</span></td>
                  <td>
                    <span class="badge cognitive-badge">{{ sess.metrics.overallCognitiveScore !== undefined ? sess.metrics.overallCognitiveScore : 100 }}%</span>
                  </td>
                </tr>
                <tr v-if="expandedSessionId === sess.sessionId" class="expandable-details-row">
                  <td colspan="10" class="details-expanded-cell">
                    <div class="details-expanded-container">
                      <!-- Export Action Buttons -->
                      <div class="export-actions-row" style="display: flex; gap: 12px; margin-bottom: 15px; justify-content: flex-end;">
                        <button class="btn-primary" @click.stop="exportCSV(sess)" style="background: #0d9488; padding: 6px 14px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
                          📥 Export CSV Data
                        </button>
                        <button class="btn-primary" @click.stop="exportPDF(sess)" style="background: #6366f1; padding: 6px 14px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
                          📄 Export Clinical PDF (EN)
                        </button>
                      </div>

                      <!-- Clinical Diagnosis Report Panel -->
                      <div v-if="sess.gameMode === 'diagnostic' && getDiagnosticSummary(sess)" class="diagnostic-report-card glass-panel" style="margin-bottom: 20px; padding: 18px; border: 1.5px solid rgba(45, 212, 191, 0.45); background: rgba(15, 23, 42, 0.9);">
                        <h4 style="color: #2dd4bf; margin: 0 0 12px 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                          🩺 รายงานการวินิจฉัยและสถิติจลนศาสตร์เชิงลึก (Clinical Diagnostics Report)
                        </h4>
                        
                        <div class="diagnostic-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
                          <div class="diag-col" style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <h5 style="color: #38bdf8; margin: 0 0 8px 0; font-size: 0.9rem;">📡 มิติจลนศาสตร์ 3 มิติ (3D Kinematic Profile)</h5>
                            <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 0.85rem; display: flex; flex-direction: column; gap: 6px;">
                              <li><strong>องศาข้อไหล่ซ้าย (Left Shoulder Range):</strong> {{ getDiagnosticSummary(sess).avgLeftShoulder }}°</li>
                              <li><strong>องศาข้อไหล่ขวา (Right Shoulder Range):</strong> {{ getDiagnosticSummary(sess).avgRightShoulder }}°</li>
                              <li><strong>ค่าเฉลี่ยระยะแนวลึกแกน Z มือซ้าย:</strong> {{ getDiagnosticSummary(sess).avgLeftZ }} m</li>
                              <li><strong>ค่าเฉลี่ยระยะแนวลึกแกน Z มือขวา:</strong> {{ getDiagnosticSummary(sess).avgRightZ }} m</li>
                            </ul>
                          </div>

                          <div class="diag-col" style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <h5 style="color: #c084fc; margin: 0 0 8px 0; font-size: 0.9rem;">💪 ภาวะตึงเกร็งและการขยับชดเชย (Rigidity & Compensation)</h5>
                            <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 0.85rem; display: flex; flex-direction: column; gap: 6px;">
                              <li><strong>ระดับการเกร็งเฉลี่ยมือซ้าย:</strong> {{ getDiagnosticSummary(sess).avgLeftSpas }}% (สูงสุด: {{ getDiagnosticSummary(sess).leftSpasMax }}%)</li>
                              <li><strong>ระดับการเกร็งเฉลี่ยมือขวา:</strong> {{ getDiagnosticSummary(sess).avgRightSpas }}% (สูงสุด: {{ getDiagnosticSummary(sess).rightSpasMax }}%)</li>
                              <li><strong>ความถี่การขยับไหล่/ลำตัวเอียงชดเชย:</strong> <span :style="{ color: getDiagnosticSummary(sess).compPercentage > 15 ? '#f43f5e' : '#34d399' }">{{ getDiagnosticSummary(sess).compPercentage }}% ของเซสชัน</span></li>
                            </ul>
                          </div>
                        </div>

                        <div class="diagnostic-recommendations" style="background: rgba(245, 158, 11, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.25);">
                          <h5 style="color: #f59e0b; margin: 0 0 6px 0; font-size: 0.9rem;">🩺 แผนการฟื้นฟูและข้อแนะนำการแพทย์ (Clinical Guidance)</h5>
                          <ul style="margin: 0; padding-left: 20px; font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px; color: #f1f5f9;">
                            <li v-for="(rec, rIdx) in getDiagnosticSummary(sess).recommendations" :key="rIdx">
                              {{ rec }}
                            </li>
                          </ul>
                        </div>
                      </div>

                      <h4>📊 สถิติจลนศาสตร์มาตรฐานเพิ่มเติมสำหรับเซสชันนี้</h4>
                      <div class="details-grid">
                        <div class="details-column">
                          <h5>มือซ้าย (Left Hand)</h5>
                          <ul>
                            <li><strong>Reaction Time:</strong> {{ sess.detailed?.left?.RT || 0 }} ms</li>
                            <li><strong>Movement Time:</strong> {{ sess.detailed?.left?.MT || 0 }} ms</li>
                            <li><strong>Target Success Rate:</strong> {{ sess.detailed?.left?.successRate || 0 }}%</li>
                            <li><strong>Endpoint Precision Error:</strong> {{ sess.detailed?.left?.error || 0 }} px</li>
                            <li><strong>Resting Jitter:</strong> {{ sess.detailed?.left?.jitter || 0 }} px</li>
                            <li><strong>Path Smoothness:</strong> {{ sess.detailed?.left?.smoothness || 1.0 }}x</li>
                          </ul>
                        </div>
                        <div class="details-column">
                          <h5>มือขวา (Right Hand)</h5>
                          <ul>
                            <li><strong>Reaction Time:</strong> {{ sess.detailed?.right?.RT || 0 }} ms</li>
                            <li><strong>Movement Time:</strong> {{ sess.detailed?.right?.MT || 0 }} ms</li>
                            <li><strong>Target Success Rate:</strong> {{ sess.detailed?.right?.successRate || 0 }}%</li>
                            <li><strong>Endpoint Precision Error:</strong> {{ sess.detailed?.right?.error || 0 }} px</li>
                            <li><strong>Resting Jitter:</strong> {{ sess.detailed?.right?.jitter || 0 }} px</li>
                            <li><strong>Path Smoothness:</strong> {{ sess.detailed?.right?.smoothness || 1.0 }}x</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import MedicalAssessmentEngine from '../utils/MedicalAssessmentEngine.js';
import { generateEnglishReportHTML } from '../utils/reportTemplate.js';

Chart.register(...registerables);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const patients = ref([]);
const sessions = ref([]);
const selectedPatientId = ref('');
const chartCanvas = ref(null);
let chartInstance = null;

const clinicalAlert = ref(null);
const dashboardError = ref('');

// Left Hand stats averages
const leftSpeed = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.leftHandSpeed || 0), 0) / sessions.value.length);
});
const leftAccuracy = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.leftHandAccuracy || 0), 0) / sessions.value.length);
});
const leftQuality = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.leftHandQuality || 0), 0) / sessions.value.length);
});

// Right Hand stats averages
const rightSpeed = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.rightHandSpeed || 0), 0) / sessions.value.length);
});
const rightAccuracy = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.rightHandAccuracy || 0), 0) / sessions.value.length);
});
const rightQuality = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.rightHandQuality || 0), 0) / sessions.value.length);
});

const avgLimbSelection = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.limbSelectionRatio || 0), 0) / sessions.value.length);
});

const avgCognitiveScore = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.overallCognitiveScore !== undefined ? s.metrics.overallCognitiveScore : 100), 0) / sessions.value.length);
});

const avgLeftDominance = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.leftDominanceScore || 0), 0) / sessions.value.length);
});

const avgRightDominance = computed(() => {
  if (sessions.value.length === 0) return 0;
  return Math.round(sessions.value.reduce((acc, s) => acc + (s.metrics?.rightDominanceScore || 0), 0) / sessions.value.length);
});

const predictedDominantHand = computed(() => {
  if (avgLeftDominance.value === 0 && avgRightDominance.value === 0) return 'undetermined';
  const gap = Math.abs(avgLeftDominance.value - avgRightDominance.value);
  if (gap < 8) return 'balanced';
  return avgLeftDominance.value > avgRightDominance.value ? 'left' : 'right';
});

const learnedNonUseRisk = computed(() => {
  const riskRank = { high: 3, moderate: 2, low: 1, undetermined: 0 };
  const highest = sessions.value.reduce((current, session) => {
    const risk = session.metrics?.learnedNonUseRisk || 'undetermined';
    return riskRank[risk] > riskRank[current] ? risk : current;
  }, 'undetermined');
  return highest;
});

const formatDominantHand = (hand) => {
  if (hand === 'left') return 'มือซ้าย';
  if (hand === 'right') return 'มือขวา';
  if (hand === 'balanced') return 'ใกล้เคียงกัน';
  return 'ยังไม่พอประเมิน';
};

const formatRisk = (risk) => {
  if (risk === 'high') return 'สูง';
  if (risk === 'moderate') return 'ปานกลาง';
  if (risk === 'low') return 'ต่ำ';
  return 'ยังไม่พอประเมิน';
};

const getDiagnosticSummary = (sess) => {
  if (!sess.rawLogs || sess.rawLogs.length === 0) return null;
  
  let leftSpasSum = 0, leftSpasCount = 0, leftSpasMax = 0;
  let rightSpasSum = 0, rightSpasCount = 0, rightSpasMax = 0;
  let leftShoulderSum = 0, leftShoulderCount = 0;
  let rightShoulderSum = 0, rightShoulderCount = 0;
  let compCount = 0;
  let leftZSum = 0, leftZCount = 0;
  let rightZSum = 0, rightZCount = 0;
  
  sess.rawLogs.forEach(log => {
    if (log.leftSpasticityScore !== undefined && log.leftFingerX !== 0) {
      leftSpasSum += log.leftSpasticityScore;
      leftSpasCount++;
      if (log.leftSpasticityScore > leftSpasMax) leftSpasMax = log.leftSpasticityScore;
    }
    if (log.rightSpasticityScore !== undefined && log.rightFingerX !== 0) {
      rightSpasSum += log.rightSpasticityScore;
      rightSpasCount++;
      if (log.rightSpasticityScore > rightSpasMax) rightSpasMax = log.rightSpasticityScore;
    }
    if (log.leftShoulderAngle !== undefined && log.leftShoulderAngle !== null) {
      leftShoulderSum += log.leftShoulderAngle;
      leftShoulderCount++;
    }
    if (log.rightShoulderAngle !== undefined && log.rightShoulderAngle !== null) {
      rightShoulderSum += log.rightShoulderAngle;
      rightShoulderCount++;
    }
    if (log.leftFingerZ !== undefined && log.leftFingerX !== 0) {
      leftZSum += log.leftFingerZ;
      leftZCount++;
    }
    if (log.rightFingerZ !== undefined && log.rightFingerX !== 0) {
      rightZSum += log.rightFingerZ;
      rightZCount++;
    }
    if (log.compensatoryMovement === true) {
      compCount++;
    }
  });
  
  const avgLeftSpas = leftSpasCount > 0 ? Math.round(leftSpasSum / leftSpasCount) : 0;
  const avgRightSpas = rightSpasCount > 0 ? Math.round(rightSpasSum / rightSpasCount) : 0;
  const avgLeftShoulder = leftShoulderCount > 0 ? Math.round(leftShoulderSum / leftShoulderCount) : 0;
  const avgRightShoulder = rightShoulderCount > 0 ? Math.round(rightShoulderSum / rightShoulderCount) : 0;
  const avgLeftZ = leftZCount > 0 ? (leftZSum / leftZCount).toFixed(3) : '0.000';
  const avgRightZ = rightZCount > 0 ? (rightZSum / rightZCount).toFixed(3) : '0.000';
  
  const totalFrames = sess.rawLogs.length;
  const compPercentage = totalFrames > 0 ? Math.round((compCount / totalFrames) * 100) : 0;
  
  const currentPatient = patients.value.find(p => p.patientId === sess.patientId);
  const affectedSide = currentPatient?.affectedSide || 'right';
  const affectedSpas = affectedSide === 'left' ? avgLeftSpas : avgRightSpas;
  const selectionRatio = sess.metrics?.limbSelectionRatio || 0;
  
  let recs = [];
  if (affectedSpas > 55) {
    recs.push("🚨 ตรวจพบภาวะกล้ามเนื้ออ่อนแรงเกร็งตัวเด่นชัด (Spasticity) แนะนำปรึกษาแพทย์ร่วมกับบำบัดผ่อนคลายและลดความเร็วการฝึก");
  }
  if (selectionRatio < 28 && affectedSpas < 45) {
    recs.push("💡 อัตราใช้มืออ่อนแรงต่ำมากเข้าข่าย Learned Non-Use แนะนำรักษาโดยการจำกัดข้างดีเพื่อบังคับข้างอ่อนแรง (CIMT)");
  }
  if (compPercentage > 15) {
    recs.push("⚠️ พฤติกรรมไหล่เอียงชดเชยสูง แนะนำปรับระยะห่างหรือล็อกท่าทางผู้ป่วยให้หลังพิงพนักตรงเพื่อเลี่ยงการบาดเจ็บ");
  }
  if (recs.length === 0) {
    recs.push("✅ การฝึกควบคุมสรีระและข้อไหล่อยู่ในเกณฑ์ดี แนะนำให้ออกกำลังฟื้นฟูต่อเนื่องวันละ 15-20 นาที");
  }
  
  return {
    avgLeftSpas,
    avgRightSpas,
    leftSpasMax,
    rightSpasMax,
    avgLeftShoulder,
    avgRightShoulder,
    avgLeftZ,
    avgRightZ,
    compPercentage,
    recommendations: recs
  };
};

const expandedSessionId = ref(null);
const toggleExpandSession = (sessionId) => {
  if (expandedSessionId.value === sessionId) {
    expandedSessionId.value = null;
  } else {
    expandedSessionId.value = sessionId;
  }
};

const exportCSV = (sess) => {
  if (!sess || !sess.rawLogs || sess.rawLogs.length === 0) return;
  let csvContent = "\uFEFF";
  csvContent += "Frame,Timestamp,State,Required Hand,Observed Hand,Left Finger X,Left Finger Y,Left Finger Z,Right Finger X,Right Finger Y,Right Finger Z,Left Spasticity Score,Right Spasticity Score,Left Shoulder Angle,Right Shoulder Angle,Compensatory Movement\n";
  
  sess.rawLogs.forEach((log, index) => {
    const row = [
      index + 1,
      log.timestamp,
      log.state,
      log.requiredHand || 'any',
      log.usedHand || 'none',
      log.leftFingerX || 0,
      log.leftFingerY || 0,
      log.leftFingerZ || 0,
      log.rightFingerX || 0,
      log.rightFingerY || 0,
      log.rightFingerZ || 0,
      log.leftSpasticityScore || 0,
      log.rightSpasticityScore || 0,
      log.leftShoulderAngle !== null && log.leftShoulderAngle !== undefined ? log.leftShoulderAngle : '',
      log.rightShoulderAngle !== null && log.rightShoulderAngle !== undefined ? log.rightShoulderAngle : '',
      log.compensatoryMovement ? "TRUE" : "FALSE"
    ].join(",");
    csvContent += row + "\n";
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `NeuroDex_Clinical_Data_${sess.sessionId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportPDF = (sess) => {
  if (!sess) return;
  const currentPatient = patients.value.find(p => p.patientId === sess.patientId);
  const summary = getDiagnosticSummary(sess);
  const htmlContent = generateEnglishReportHTML(currentPatient, sess, summary, sess.rawLogs);
  
  const printWindow = window.open("", "_blank");
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

const sessionTrends = computed(() => {
  if (analyzedSessions.value.length < 2) return [];
  const chrono = [...analyzedSessions.value].reverse();
  const trends = [];
  
  for (let i = 1; i < chrono.length; i++) {
    const prev = chrono[i - 1];
    const curr = chrono[i];
    
    const prevSum = getDiagnosticSummary(prev) || { avgLeftShoulder: 0, avgRightShoulder: 0, avgLeftSpas: 0, avgRightSpas: 0 };
    const currSum = getDiagnosticSummary(curr) || { avgLeftShoulder: 0, avgRightShoulder: 0, avgLeftSpas: 0, avgRightSpas: 0 };
    
    const leftROMDiff = (currSum.avgLeftShoulder || 0) - (prevSum.avgLeftShoulder || 0);
    const rightROMDiff = (currSum.avgRightShoulder || 0) - (prevSum.avgRightShoulder || 0);
    
    const leftSpasDiff = (currSum.avgLeftSpas || 0) - (prevSum.avgLeftSpas || 0);
    const rightSpasDiff = (currSum.avgRightSpas || 0) - (prevSum.avgRightSpas || 0);
    
    const selectionRatioDiff = (curr.metrics?.limbSelectionRatio || 0) - (prev.metrics?.limbSelectionRatio || 0);
    
    trends.push({
      date: curr.date,
      sessionId: curr.sessionId,
      prevSessionId: prev.sessionId,
      leftROMDiff,
      rightROMDiff,
      leftSpasDiff,
      rightSpasDiff,
      selectionRatioDiff
    });
  }
  
  return trends.reverse();
});

const analyzedSessions = computed(() => {
  const currentPatient = patients.value.find(p => p.patientId === selectedPatientId.value);
  const affectedSide = currentPatient?.affectedSide || 'right';
  return sessions.value.map(s => {
    let detailed = {
      left: { RT: 0, MT: 0, successRate: 0, error: 0, jitter: 0, smoothness: 1.0 },
      right: { RT: 0, MT: 0, successRate: 0, error: 0, jitter: 0, smoothness: 1.0 }
    };
    if (s.rawLogs && s.rawLogs.length > 0) {
      const analysis = MedicalAssessmentEngine.analyze(s.rawLogs, { affectedSide });
      detailed = analysis.detailedMetrics;
    }
    return {
      ...s,
      detailed
    };
  });
});

const avgLeftRT = computed(() => {
  if (analyzedSessions.value.length === 0) return 0;
  return Math.round(analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.left?.RT || 0), 0) / analyzedSessions.value.length);
});
const avgRightRT = computed(() => {
  if (analyzedSessions.value.length === 0) return 0;
  return Math.round(analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.right?.RT || 0), 0) / analyzedSessions.value.length);
});

const avgLeftMT = computed(() => {
  if (analyzedSessions.value.length === 0) return 0;
  return Math.round(analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.left?.MT || 0), 0) / analyzedSessions.value.length);
});
const avgRightMT = computed(() => {
  if (analyzedSessions.value.length === 0) return 0;
  return Math.round(analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.right?.MT || 0), 0) / analyzedSessions.value.length);
});

const avgLeftPrecision = computed(() => {
  if (analyzedSessions.value.length === 0) return 0;
  const val = analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.left?.error || 0), 0) / analyzedSessions.value.length;
  return Math.round(val * 10) / 10;
});
const avgRightPrecision = computed(() => {
  if (analyzedSessions.value.length === 0) return 0;
  const val = analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.right?.error || 0), 0) / analyzedSessions.value.length;
  return Math.round(val * 10) / 10;
});

const avgLeftJitterVal = computed(() => {
  if (analyzedSessions.value.length === 0) return 0;
  const val = analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.left?.jitter || 0), 0) / analyzedSessions.value.length;
  return Math.round(val * 100) / 100;
});
const avgRightJitterVal = computed(() => {
  if (analyzedSessions.value.length === 0) return 0;
  const val = analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.right?.jitter || 0), 0) / analyzedSessions.value.length;
  return Math.round(val * 100) / 100;
});

const avgLeftSmoothnessVal = computed(() => {
  if (analyzedSessions.value.length === 0) return 1.0;
  const val = analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.left?.smoothness || 1.0), 0) / analyzedSessions.value.length;
  return Math.round(val * 100) / 100;
});
const avgRightSmoothnessVal = computed(() => {
  if (analyzedSessions.value.length === 0) return 1.0;
  const val = analyzedSessions.value.reduce((acc, s) => acc + (s.detailed?.right?.smoothness || 1.0), 0) / analyzedSessions.value.length;
  return Math.round(val * 100) / 100;
});

// Load patient lists & initial sessions
const loadInitialData = async () => {
  try {
    dashboardError.value = '';
    const patientsRes = await axios.get(`${API_URL}/api/patients`);
    patients.value = patientsRes.data;

    const sessionsRes = await axios.get(`${API_URL}/api/sessions`);
    sessions.value = sessionsRes.data;
    
    // Auto-select first patient if available
    if (patients.value.length > 0) {
      selectedPatientId.value = patients.value[0].patientId;
      fetchPatientData();
    } else {
      renderChart();
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    dashboardError.value = 'ไม่สามารถโหลดข้อมูลแดชบอร์ดจากเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า backend กำลังทำงานอยู่';
    patients.value = [];
    sessions.value = [];
    clinicalAlert.value = null;
    renderChart();
  }
};

const fetchPatientData = async () => {
  try {
    dashboardError.value = '';
    let patientSessions = [];
    if (selectedPatientId.value) {
      const res = await axios.get(`${API_URL}/api/sessions/patient/${selectedPatientId.value}`);
      patientSessions = res.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      sessions.value = patientSessions;
    } else {
      const res = await axios.get(`${API_URL}/api/sessions`);
      patientSessions = res.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      sessions.value = patientSessions;
    }

    // Evaluate Quality Deterioration Alert for selected patient
    clinicalAlert.value = null;
    const currentPatient = patients.value.find(p => p.patientId === selectedPatientId.value);
    if (currentPatient && patientSessions.length >= 3) {
      const side = currentPatient.affectedSide;
      const qKey = side === 'left' ? 'leftHandQuality' : 'rightHandQuality';
      const lastThree = patientSessions.slice(-3);
      
      const q1 = lastThree[0].metrics[qKey];
      const q2 = lastThree[1].metrics[qKey];
      const q3 = lastThree[2].metrics[qKey];

      if (q1 > q2 && q2 > q3) {
        clinicalAlert.value = {
          affectedSide: side,
          scores: [q1, q2, q3],
          email: currentPatient.therapistEmail || 'therapist@neurodex.com'
        };
      }
    }

    renderChart();
  } catch (err) {
    console.error('Error fetching patient records:', err);
    dashboardError.value = 'ไม่สามารถโหลดประวัติผู้ป่วยรายนี้ได้ กรุณาลองใหม่อีกครั้ง';
    sessions.value = [];
    clinicalAlert.value = null;
    renderChart();
  }
};

const formatDate = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Render progress charts
const renderChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
  }

  if (!chartCanvas.value || sessions.value.length === 0) return;

  const ctx = chartCanvas.value.getContext('2d');
  
  // Format labels & values
  const labels = sessions.value.map(s => new Date(s.date).toLocaleDateString());
  const leftQualityData = sessions.value.map(s => s.metrics?.leftHandQuality || 0);
  const rightQualityData = sessions.value.map(s => s.metrics?.rightHandQuality || 0);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'คุณภาพการเคลื่อนไหวมือซ้าย (%)',
          data: leftQualityData,
          borderColor: 'rgb(129, 140, 248)', // Indigo
          backgroundColor: 'rgba(129, 140, 248, 0.1)',
          tension: 0.3,
          borderWidth: 3
        },
        {
          label: 'คุณภาพการเคลื่อนไหวมือขวา (%)',
          data: rightQualityData,
          borderColor: 'rgb(244, 114, 182)', // Pink
          backgroundColor: 'rgba(244, 114, 182, 0.1)',
          tension: 0.3,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' },
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'คะแนนคุณภาพ (%)',
            color: '#94a3b8'
          }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#f8fafc', font: { family: 'Outfit' } }
        }
      }
    }
  });
};

onMounted(() => {
  loadInitialData();
});

defineExpose({
  refresh: loadInitialData
});
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 1.8rem;
  background: linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.patient-selector-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.select-input {
  min-width: 250px;
}

.clinical-alert-banner {
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.1);
  padding: 16px 24px;
  border-radius: var(--border-radius-md);
  margin-bottom: 24px;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.15);
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f87171;
  margin-bottom: 8px;
}

.alert-icon {
  width: 24px;
  height: 24px;
}

.alert-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #f87171;
}

.alert-details {
  font-size: 0.85rem;
  color: #fca5a5;
  margin-top: 4px;
}

.dashboard-error {
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
  padding: 14px 18px;
  border-radius: var(--border-radius-sm);
  margin-bottom: 20px;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: hsl(var(--text-muted));
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comparison-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.hand-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.hand-card h3 {
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.left-hand h3 { color: #818cf8; }
.right-hand h3 { color: #f472b6; }
.limb-selection h3 { color: #34d399; }
.cognitive-score h3 { color: #f59e0b; }
.prediction-card h3 { color: #38bdf8; }
.risk-card h3 { color: #fb7185; }
.cognitive-score .selection-value .percent { color: #f59e0b; }
.prediction-card .selection-value .percent { color: #38bdf8; font-size: 2.2rem; }
.risk-card .selection-value .percent { color: #fb7185; font-size: 2.2rem; }

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.metric-row .label {
  font-size: 0.85rem;
  color: hsl(var(--text-muted));
}

.metric-row .value {
  font-weight: 700;
  font-size: 1.2rem;
}

.selection-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
}

.selection-value .percent {
  font-size: 2.8rem;
  font-weight: 700;
  color: #34d399;
  font-family: 'Outfit', sans-serif;
}

.selection-value .desc {
  font-size: 0.8rem;
  color: hsl(var(--text-muted));
}

.explanation {
  font-size: 0.75rem;
  color: hsl(var(--text-muted));
  line-height: 1.4;
  margin-top: 12px;
}

.chart-section {
  padding: 24px;
}

.chart-subtitle {
  font-size: 0.85rem;
  color: hsl(var(--text-muted));
  margin: -6px 0 16px 0;
}

.chart-wrapper {
  height: 350px;
  position: relative;
}

.history-section {
  padding: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.history-table th, .history-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.history-table th {
  font-family: 'Outfit', sans-serif;
  color: hsl(var(--text-muted));
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  margin-right: 4px;
}

.mode-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.speed-badge { background: rgba(45, 212, 191, 0.15); color: #2dd4bf; }
.accuracy-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.quality-badge { background: rgba(129, 140, 248, 0.15); color: #818cf8; }
.cognitive-badge { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.risk-badge { background: rgba(251, 113, 133, 0.15); color: #fb7185; }

.font-mono {
  font-family: monospace;
}

.kinematics-comparison-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.kinematics-header-row {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr;
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 6px;
}

.kinematics-data-row {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  align-items: center;
}

.col-title {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.text-indigo { color: #818cf8; }
.text-pink { color: #f472b6; }

.clickable-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.details-expanded-cell {
  background: rgba(15, 23, 42, 0.4);
  padding: 20px !important;
}

.details-expanded-container {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
  background: rgba(11, 15, 25, 0.6);
}

.details-expanded-container h4 {
  margin: 0 0 12px 0;
  color: #2dd4bf;
  font-size: 0.95rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.details-column h5 {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 4px;
}

.details-column h5:first-of-type {
  color: #818cf8;
}

.details-grid .details-column:last-of-type h5 {
  color: #f472b6;
}

.details-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.details-column li {
  font-size: 0.85rem;
  color: #94a3b8;
}

.details-column li strong {
  color: #f8fafc;
}

.detailed-kinematics-card {
  grid-column: span 2;
}

@media (max-width: 900px) {
  .detailed-kinematics-card {
    grid-column: span 1;
  }
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
