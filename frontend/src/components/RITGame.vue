<template>
  <div class="rit-game-container glass-panel-glow">
    <!-- Blocking Orientation Warning for Mobile/Tablet in Portrait -->
    <div v-if="isMobileOrTablet && isPortrait" class="orientation-blocker">
      <div class="blocker-content">
        <div class="rotate-icon">🔄</div>
        <h3>กรุณาหมุนอุปกรณ์เป็นแนวนอน</h3>
        <p>ระบบประเมินจลนศาสตร์การเคลื่อนไหวจำเป็นต้องใช้หน้าจอในแนวนอน (Landscape Mode) เพื่อวิเคราะห์สรีระและพิกัดการเอื้อมสกัดกั้นได้อย่างถูกต้อง</p>
      </div>
    </div>

    <div class="game-header">
      <div class="header-info">
        <h2>ระบบประเมินการเอื้อมสกัดกั้นวัตถุ (RIT)</h2>
        <p class="subtitle">การประเมินความคล่องแคล่วและการละเลยการใช้งานมือซ้าย-ขวา (Learned Non-Use)</p>
      </div>
      <div class="game-timer" :class="{ 'timer-low': timeLeft < 15 }">
        <span class="timer-label">เวลาที่เหลือ:</span>
        <span class="timer-value">{{ timeLeft }} วินาที</span>
      </div>
    </div>

    <!-- Setup Form (Before Game Starts) -->
    <div v-if="gameState === 'setup'" class="setup-screen">
      <div class="instructions-card glass-panel">
        <h3>การตั้งค่าและปรับเทียบสำหรับคลินิก</h3>
        <p>กรุณากรอกข้อมูลประวัติผู้ป่วยและเลือกการตั้งค่าการประเมินผลด้านล่าง</p>
        
        <div class="form-group">
          <label for="patient-id">กรอกหรือเลือก รหัสผู้ป่วย (Patient ID):</label>
          <div class="patient-input-row">
            <input 
              id="patient-id" 
              v-model="patientForm.patientId" 
              class="form-input" 
              placeholder="เช่น PT-901"
            />
            <input 
              id="patient-name" 
              v-model="patientForm.name" 
              class="form-input" 
              placeholder="ชื่อผู้ป่วย"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="therapist-email">อีเมลนักกายภาพบำบัด (สำหรับรับการเตือนเมื่อคะแนนลดลง):</label>
          <input 
            id="therapist-email" 
            v-model="patientForm.therapistEmail" 
            class="form-input" 
            placeholder="therapist@neurodex.com"
          />
        </div>

        <div class="form-group">
          <label>ซีกร่างกายที่กล้ามเนื้ออ่อนแรง (Affected Side):</label>
          <div class="radio-group">
            <label class="radio-label" :class="{ active: patientForm.affectedSide === 'left' }">
              <input type="radio" value="left" v-model="patientForm.affectedSide"> ซีกซ้าย
            </label>
            <label class="radio-label" :class="{ active: patientForm.affectedSide === 'right' }">
              <input type="radio" value="right" v-model="patientForm.affectedSide"> ซีกขวา
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>โหมดการประเมิน:</label>
          <div class="radio-group" style="display: flex; flex-direction: column; gap: 8px;">
            <label class="radio-label" :class="{ active: gameMode === 'random' }">
              <input type="radio" value="random" v-model="gameMode"> 🎯 โหมดสุ่ม (ประเมินความพึงใจในการเลือกใช้มือ)
            </label>
            <label class="radio-label" :class="{ active: gameMode === 'forced' }">
              <input type="radio" value="forced" v-model="gameMode"> 🔒 โหมดบังคับข้าง (ประเมินเฉพาะข้างซีกอ่อนแรง)
            </label>
            <label class="radio-label" :class="{ active: gameMode === 'bilateral' }">
              <input type="radio" value="bilateral" v-model="gameMode"> 👐 โหมดสองมือพร้อมกัน (Bilateral - ฝึกการประสานงานของสองมือ)
            </label>
            <label class="radio-label" :class="{ active: gameMode === 'range_of_motion' }">
              <input type="radio" value="range_of_motion" v-model="gameMode"> 📐 โหมดขอบเขตข้อไหล่ (Range of Motion - วิเคราะห์องศาการเอื้อมสูง/ต่ำ)
            </label>
            <label class="radio-label" :class="{ active: gameMode === 'cognitive_match' }">
              <input type="radio" value="cognitive_match" v-model="gameMode"> 🧠 โหมดสลับสีสแกนสมอง (Cognitive Matching - เปลี่ยนกฎเป้าหมายระหว่างเล่น)
            </label>
            <label class="radio-label" :class="{ active: gameMode === 'diagnostic' }">
              <input type="radio" value="diagnostic" v-model="gameMode"> 📊 โหมดวิเคราะห์เชิงลึกทางการแพทย์ (Clinical Diagnostics - บันทึก Z-depth, อาการเกร็ง และสรีระไหล่ 3D)
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="cognitive-rule">กฎการกรองความรู้ความเข้าใจ (Cognitive Rule):</label>
          <select id="cognitive-rule" v-model="cognitiveRule" class="form-input">
            <option value="red_circle">สกัดกั้นเฉพาะวงกลมสีแดงเท่านั้น (หลีกเลี่ยงเป้าหมายอื่น)</option>
            <option value="red_square">สกัดกั้นเฉพาะสี่เหลี่ยมสีแดงเท่านั้น (หลีกเลี่ยงเป้าหมายอื่น)</option>
            <option value="blue_circle">สกัดกั้นเฉพาะวงกลมสีน้ำเงินเท่านั้น (หลีกเลี่ยงเป้าหมายอื่น)</option>
            <option value="blue_square">สกัดกั้นเฉพาะสี่เหลี่ยมสีน้ำเงินเท่านั้น (หลีกเลี่ยงเป้าหมายอื่น)</option>
          </select>
        </div>

        <div class="form-group" style="background: rgba(239, 68, 68, 0.05); padding: 14px; border: 1.5px dashed rgba(239, 68, 68, 0.35); border-radius: 8px; margin-top: 15px; margin-bottom: 15px;">
          <label style="color: #f87171; display: flex; align-items: center; gap: 6px; font-weight: bold; margin-bottom: 4px;">
            💓 วัดชีพจรเต้นหัวใจ (Heart Rate via Apple Watch / BLE Device)
          </label>
          <p style="font-size: 0.8rem; color: #94a3b8; margin: 0 0 10px 0;">เชื่อมต่ออุปกรณ์วัดชีพจร Bluetooth แบบเรียลไทม์ เพื่อเฝ้าระวังอัตราการเต้นของหัวใจระหว่างการฝึกฟื้นฟู</p>
          
          <div style="display: flex; gap: 12px; align-items: center;">
            <button class="btn-primary" @click="connectHeartRate" style="background: #dc2626; border: none; font-size: 0.85rem; padding: 8px 16px; margin: 0; cursor: pointer;">
              {{ bleConnected ? '✅ ' + bleDeviceName : '🔗 เชื่อมต่อผ่านบลูทูธ (Connect BLE)' }}
            </button>
            <div v-if="bleConnected" style="font-weight: bold; color: #ef4444; font-size: 1.1rem; display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; animation: heartBeat 1s infinite alternate; font-size: 1.25rem;">❤️</span>
              <span>{{ currentHeartRate }} BPM</span>
            </div>
          </div>
          <div v-if="bleError" style="color: #f87171; font-size: 0.75rem; margin-top: 6px;">
            {{ bleError }}
          </div>
        </div>

        <div class="setup-controls">
          <button class="btn-primary" @click="startCalibration" :disabled="!patientForm.patientId || !patientForm.name">
            เริ่มการเชื่อมต่อกล้องและโมเดลประมวลผล
          </button>
        </div>
      </div>
    </div>

    <!-- Calibration / Testing Screen -->
    <div v-show="gameState === 'calibrating' || gameState === 'playing'" class="arena-wrapper">
      <!-- Hidden Video Element for MediaPipe -->
      <video ref="videoElement" class="hidden-video" width="640" height="480" autoplay playsinline muted></video>

      <!-- Main Interaction Canvas -->
      <div class="canvas-container">
        <canvas ref="canvasElement" width="800" height="500" class="game-canvas glass-panel"></canvas>


        <!-- Interactive Overlay Messages -->
        <div v-if="loadingModel" class="canvas-overlay loading-overlay">
          <div class="spinner"></div>
          <p>กำลังโหลดโมเดลตรวจจับการเคลื่อนไหวมือ (MediaPipe Hands)...</p>
        </div>

        <div v-if="runtimeError" class="canvas-overlay error-overlay">
          <h3>ไม่สามารถเริ่มการประเมินได้</h3>
          <p class="warning">{{ runtimeError }}</p>
          <div class="error-actions">
            <button class="btn-primary" @click="retryCamera">ลองเชื่อมต่อกล้องอีกครั้ง</button>
            <button class="btn-secondary" @click="abortSession">กลับไปตั้งค่าใหม่</button>
          </div>
        </div>

        <div v-if="gameState === 'calibrating' && !loadingModel && !runtimeError" class="canvas-overlay calibration-overlay">
          <h3>ปรับเทียบตำแหน่งและท่าทางของมือ</h3>
          <p>จัดท่าทางให้มือทั้งสองข้างปรากฏอยู่บนหน้าจอกล้องอย่างชัดเจน</p>
          <div v-if="autoStartCountdown > 0" class="countdown-panel">
            <span class="countdown-number">{{ autoStartCountdown }}</span>
            <p class="highlight">ตำแหน่งมือถูกต้อง ระบบจะเริ่มการทดสอบโดยอัตโนมัติ</p>
          </div>
          <p class="highlight" v-else-if="leftHandDetected && rightHandDetected">ตรวจจับพบมือทั้งสองข้างแล้ว! กรุณาวางนิ้วชี้ซ้ายในโซนพักซ้าย และนิ้วชี้ขวาในโซนพักขวาเพื่อเริ่มทดสอบ</p>
          <p class="warning" v-else>กำลังรอการตรวจจับมือและสรีระ (มือซ้าย: {{ leftHandDetected ? 'ตรวจพบแล้ว' : 'กำลังค้นหา' }}, มือขวา: {{ rightHandDetected ? 'ตรวจพบแล้ว' : 'กำลังค้นหา' }}, สรีระ: {{ poseDetected ? 'ตรวจพบแล้ว' : 'กำลังค้นหา' }})...</p>
          <p class="subtitle" v-if="leftHandDetected && rightHandDetected && autoStartCountdown === 0">ระบบจะนับถอยหลังทันทีเมื่อวางนิ้วชี้ทั้งสองข้างในโซนพักถูกต้อง</p>
        </div>
      </div>

      <!-- Live Telemetry Sidebar -->
      <div class="telemetry-sidebar glass-panel">
        <h4>ข้อมูลการตรวจจับสด</h4>
        <div class="telemetry-stat">
          <span class="label">กฎการสกัดเป้าหมาย:</span>
          <span class="value accent-rule">{{ formatRuleName(cognitiveRule) }}</span>
        </div>
        <div class="telemetry-stat">
          <span class="label">ระดับความยาก (ความเร็ว):</span>
          <span class="value accent-teal">{{ currentTargetSpeed.toFixed(1) }} px/เฟรม</span>
        </div>
        <div class="telemetry-stat">
          <span class="label">ระบบประมวลผลภาพ:</span>
          <span class="value" :class="processedFrameCount > 0 ? 'text-success' : 'text-danger'">
            {{ processedFrameCount > 0 ? `กำลังทำงาน (${processedFrameCount} เฟรม)` : 'ยังไม่เริ่มอ่านภาพ' }}
          </span>
          <span v-if="modelError" class="value text-danger">{{ modelError }}</span>
        </div>
        <div class="telemetry-stat">
          <span class="label">มือซ้าย / ขวา:</span>
          <span class="value" :class="leftHandDetected ? 'text-success' : 'text-danger'">
            ซ้าย: {{ leftHandDetected ? 'ตรวจพบ' : 'ไม่พบ' }}
          </span>
          <span class="value" :class="rightHandDetected ? 'text-success' : 'text-danger'">
            ขวา: {{ rightHandDetected ? 'ตรวจพบ' : 'ไม่พบ' }}
          </span>
        </div>
        <div class="telemetry-stat">
          <span class="label">สรีระผู้ป่วย:</span>
          <span class="value" :class="poseDetected ? 'text-success' : 'text-danger'">
            {{ poseDetected ? `ตรวจพบ ${visiblePoseLandmarkCount} จุดข้อต่อ` : 'ยังไม่พบโครงร่างลำตัว' }}
          </span>
        </div>
        <div class="telemetry-stat">
          <span class="label">ท่าทางปัจจุบัน:</span>
          <span class="value" :class="poseDetected ? 'text-success' : 'text-danger'">
            {{ postureStatus }}
          </span>
        </div>
        <div class="telemetry-stat" v-if="bleConnected" style="background: rgba(239, 68, 68, 0.05); padding: 8px; border-radius: 6px; border: 1.5px solid rgba(239, 68, 68, 0.3); margin-top: 8px; margin-bottom: 8px;">
          <span class="label" style="color: #ef4444; font-weight: bold; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; animation: heartBeat 0.8s infinite alternate;">❤️</span> ชีพจร (Heart Rate):
          </span>
          <span class="value" style="color: #ef4444; font-weight: bold; font-size: 1.25rem;">
            {{ currentHeartRate }} BPM
          </span>
          <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">({{ bleDeviceName }})</div>
        </div>

        <div class="telemetry-stat" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
          <span class="label">องศาไหล่ (ROM):</span>
          <span class="value">
            L: {{ leftShoulderAngle !== null ? leftShoulderAngle + '°' : '--' }} |
            R: {{ rightShoulderAngle !== null ? rightShoulderAngle + '°' : '--' }}
          </span>
        </div>

        <div class="telemetry-stat">
          <span class="label">ระยะลึก (3D Z-Depth):</span>
          <span class="value">
            L: {{ leftFingerZ.toFixed(3) }}m |
            R: {{ rightFingerZ.toFixed(3) }}m
          </span>
        </div>

        <div class="telemetry-stat">
          <span class="label">อาการเกร็ง (Spasticity):</span>
          <span class="value" style="display: flex; gap: 6px; flex-wrap: wrap;">
            <span :style="{ color: leftHandSpasticityScore > 60 ? '#ef4444' : (leftHandSpasticityScore > 40 ? '#f59e0b' : '#34d399') }">L: {{ leftHandSpasticity }}</span> |
            <span :style="{ color: rightHandSpasticityScore > 60 ? '#ef4444' : (rightHandSpasticityScore > 40 ? '#f59e0b' : '#34d399') }">R: {{ rightHandSpasticity }}</span>
          </span>
        </div>

        <div class="telemetry-stat" v-if="isCompensating" style="background: rgba(239, 68, 68, 0.1); padding: 6px; border-radius: 6px; border: 1px solid #ef4444; margin-top: 4px; margin-bottom: 4px;">
          <span class="label" style="color: #ef4444; font-weight: bold;">⚠️ ตรวจพบการเอียงชดเชย!</span>
        </div>

        <div class="telemetry-stat">
          <span class="label">สถานะเป้าหมาย:</span>
          <span class="value highlight-state">
            {{ stateMachineState === 'resting' ? 'พักอยู่กับที่' : (stateMachineState === 'moving' ? 'กำลังเคลื่อนเอื้อม' : (stateMachineState === 'hit' ? 'สกัดเป้าสำเร็จ' : 'เป้าหมายผ่านไป')) }}
          </span>
        </div>
        <div class="telemetry-stat">
          <span class="label">จำนวนข้อมูลเฟรม:</span>
          <span class="value">{{ sessionLogs.length }} เฟรม</span>
        </div>
        
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: `${(60 - timeLeft) / 60 * 100}%` }"></div>
        </div>

        <button class="btn-secondary abort-btn" @click="abortSession">
          ยกเลิกการประเมิน
        </button>
      </div>
    </div>

    <!-- Results Saving Screen -->
    <div v-if="gameState === 'submitting'" class="submitting-screen glass-panel">
      <div class="spinner"></div>
      <h3>กำลังวิเคราะห์และประมวลผลข้อมูลจลนศาสตร์...</h3>
      <p>กำลังรันสมการประเมินเพื่อหาความเร็ว (Speed), ความแม่นยำ (Accuracy), และคุณภาพทางคลินิก (Quality) ของมือซ้ายและขวา</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue';
import axios from 'axios';
import MedicalAssessmentEngine from '../utils/MedicalAssessmentEngine.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const emit = defineEmits(['session-saved']);

// Component Refs
const videoElement = ref(null);
const canvasElement = ref(null);

// Game State Management
const gameState = ref('setup'); // setup, calibrating, playing, submitting
const loadingModel = ref(true);
const handDetected = ref(false);
const cameraReady = ref(false);
const timeLeft = ref(60);
const sessionLogs = ref([]);
const runtimeError = ref('');
const autoStartCountdown = ref(0);

// Orientation and device detection
const isMobileOrTablet = ref(false);
const isPortrait = ref(false);

const checkOrientation = () => {
  isMobileOrTablet.value = /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) && 
                           (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  isPortrait.value = window.innerHeight > window.innerWidth;
};

// Fullscreen helpers
const enterFullscreen = () => {
  const elem = document.documentElement;
  try {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.warn('Fullscreen request failed:', err));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  } catch (e) {
    console.warn('Fullscreen error:', e);
  }
};

const exitFullscreen = () => {
  try {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  } catch (e) {
    console.warn('Exit fullscreen error:', e);
  }
};



// Patient State
const patientForm = reactive({
  patientId: '',
  name: '',
  affectedSide: 'right',
  therapistEmail: 'therapist@neurodex.com'
});

// Game Configurations
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const targetRadius = 38;
const fingerIndicatorRadius = 8;

// Particle System State
const particles = ref([]);

// Adaptive Difficulty Variables
const BASE_SPEED = 4.5;
const currentTargetSpeed = ref(BASE_SPEED);
const BASE_SPAWN_INTERVAL = 3000; // ms
const currentSpawnInterval = ref(BASE_SPAWN_INTERVAL);
const rollingOutcomes = ref([]); // array of { timestamp, hit }

// Cognitive Rule Variables
const cognitiveRule = ref('red_circle'); // red_circle, red_square, blue_circle, blue_square

const getRuleParts = () => {
  const [color, shape] = cognitiveRule.value.split('_');
  return { color, shape };
};

const createTargetCognitiveProperties = () => {
  const rule = getRuleParts();
  const shouldSpawnCorrectTarget = Math.random() < 0.65;
  if (shouldSpawnCorrectTarget) {
    return {
      colorName: rule.color,
      shape: rule.shape,
      isCorrectTarget: true
    };
  }

  const colors = ['red', 'blue'];
  const shapes = ['circle', 'square'];
  let colorName = colors[Math.floor(Math.random() * colors.length)];
  let shape = shapes[Math.floor(Math.random() * shapes.length)];

  if (colorName === rule.color && shape === rule.shape) {
    if (Math.random() > 0.5) {
      colorName = colors.find(color => color !== rule.color);
    } else {
      shape = shapes.find(targetShape => targetShape !== rule.shape);
    }
  }

  return {
    colorName,
    shape,
    isCorrectTarget: false
  };
};

// Two Rest Zones (Left and Right at bottom center)
const leftRestZone = {
  x: CANVAS_WIDTH / 2 - 190,
  y: CANVAS_HEIGHT - 110,
  width: 170,
  height: 90
};

const rightRestZone = {
  x: CANVAS_WIDTH / 2 + 20,
  y: CANVAS_HEIGHT - 110,
  width: 170,
  height: 90
};

// Gameplay variables
let cameraHelper = null;
let cameraStream = null;
let handsInstance = null;
let poseInstance = null;
let animationFrameId = null;
let gameTimerId = null;
let targetSpawnTimerId = null;
let difficultyScalerIntervalId = null;
let autoStartTimerId = null;
let lastResolvedTarget = null;
let isProcessingHands = false;
let isProcessingPose = false;
let lastHandsProcessTime = 0;
let lastPoseProcessTime = 0;
let mediaRecorder = null;
let recordedChunks = [];
let currentRecordingUrl = null;

// Telemetry state machine variables
const stateMachineState = ref('resting'); // resting, moving, hit, miss
const leftFingerCoords = reactive({ x: 0, y: 0 });
const rightFingerCoords = reactive({ x: 0, y: 0 });
const leftFingerZ = ref(0);
const rightFingerZ = ref(0);
const leftHandSpasticity = ref('ปกติ'); // ปกติ, ตึงตัวปานกลาง, มือเกร็ง
const rightHandSpasticity = ref('ปกติ');
const leftHandSpasticityScore = ref(0);
const rightHandSpasticityScore = ref(0);
const leftHandDetected = ref(false);
const rightHandDetected = ref(false);
const isLeftFingerInRestZone = ref(false);
const isRightFingerInRestZone = ref(false);
const poseDetected = ref(false);
const visiblePoseLandmarkCount = ref(0);
const poseLandmarks = ref([]);
const handLandmarks = ref([]);
const processedFrameCount = ref(0);
const lastDetectionMessage = ref('รอเริ่มกล้อง');
const modelError = ref('');
const postureStatus = ref('รอตรวจจับท่าทาง');
const recordingStatus = ref('ยังไม่เริ่มบันทึก');
const isRecordingVideo = ref(false);

const calculateHandSpasticity = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return { score: 0, status: 'ปกติ' };
  
  const wrist = landmarks[0];
  const mcpPoints = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
  let wristToMcpDist = 0;
  mcpPoints.forEach(p => {
    const dx = p.x - wrist.x;
    const dy = p.y - wrist.y;
    const dz = p.z - wrist.z;
    wristToMcpDist += Math.sqrt(dx*dx + dy*dy + dz*dz);
  });
  wristToMcpDist /= 4;
  
  const fingertips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  const mcps = [landmarks[2], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
  
  let totalFingerExtension = 0;
  for (let j = 0; j < 5; j++) {
    const tip = fingertips[j];
    const base = mcps[j];
    const dx = tip.x - base.x;
    const dy = tip.y - base.y;
    const dz = tip.z - base.z;
    totalFingerExtension += Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
  totalFingerExtension /= 5;
  
  const ratio = totalFingerExtension / (wristToMcpDist || 1.0);
  const score = Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));
  
  let status = 'ปกติ';
  if (score > 60) {
    status = 'มือเกร็งสะสม';
  } else if (score > 40) {
    status = 'เกร็งปานกลาง';
  }
  
  return { score, status };
};

const gameMode = ref('random'); // random, forced, bilateral, range_of_motion, cognitive_match
const activeTarget = ref(null); // { x, y, vx, vy, side, spawnTime, requiredHand, shape, color, isCorrectTarget, outcome }
const activeCognitiveRule = ref('red_circle');

// Shoulder flexion angles
const leftShoulderAngle = ref(null);
const rightShoulderAngle = ref(null);
const isCompensating = ref(false);

// Bluetooth Heart Rate (BPM) telemetry state
const currentHeartRate = ref(0);
const bleConnected = ref(false);
const bleDeviceName = ref('');
const bleError = ref('');
let bleCharacteristic = null;
let bleDevice = null;
let hrSimulatorIntervalId = null;

const connectHeartRate = async () => {
  bleError.value = '';
  if (!navigator.bluetooth) {
    bleError.value = 'เบราว์เซอร์ไม่รองรับ Bluetooth (เปิดโปรแกรมจำลอง)';
    startHeartRateSimulator();
    return;
  }
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }]
    });
    bleDeviceName.value = device.name || 'Bluetooth Heart Rate Monitor';
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic('heart_rate_measurement');
    
    bleCharacteristic = characteristic;
    bleDevice = device;
    
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', handleHeartRateNotification);
    
    bleConnected.value = true;
    bleError.value = '';
    speakText("เชื่อมต่อเครื่องวัดชีพจรสำเร็จค่ะ");
  } catch (err) {
    console.error("BLE connection failed:", err);
    bleError.value = 'เชื่อมต่อเครื่องวัดชีพจรไม่ได้: ' + err.message;
    startHeartRateSimulator();
  }
};

const handleHeartRateNotification = (event) => {
  const value = event.target.value;
  const flags = value.getUint8(0);
  const rate16Bits = flags & 0x01;
  let heartRate = 0;
  if (rate16Bits) {
    heartRate = value.getUint16(1, true);
  } else {
    heartRate = value.getUint8(1);
  }
  currentHeartRate.value = heartRate;
};

const startHeartRateSimulator = () => {
  bleConnected.value = true;
  bleDeviceName.value = 'Apple Watch (Simulated BLE)';
  currentHeartRate.value = 72;
  
  if (hrSimulatorIntervalId) clearInterval(hrSimulatorIntervalId);
  hrSimulatorIntervalId = setInterval(() => {
    if (gameState.value === 'playing') {
      const targetRate = 80 + Math.round(Math.sin(Date.now() / 6000) * 15 + Math.random() * 6);
      currentHeartRate.value = Math.max(70, Math.min(130, targetRate));
    } else {
      const targetRate = 72 + Math.round(Math.sin(Date.now() / 15000) * 3 + Math.random() * 2);
      currentHeartRate.value = Math.max(60, Math.min(85, targetRate));
    }
  }, 1000);
};

const calculateShoulderAngle = (side) => {
  if (!poseLandmarks.value || poseLandmarks.value.length === 0) return null;
  const shoulderIdx = side === 'left' ? 11 : 12;
  const elbowIdx = side === 'left' ? 13 : 14;
  const hipIdx = side === 'left' ? 23 : 24;
  
  const shoulder = getVisibleLandmark(shoulderIdx);
  const elbow = getVisibleLandmark(elbowIdx);
  const hip = getVisibleLandmark(hipIdx);
  
  if (!shoulder || !elbow || !hip) return null;
  
  // Vectors
  const v1 = { x: elbow.x - shoulder.x, y: elbow.y - shoulder.y };
  const v2 = { x: hip.x - shoulder.x, y: hip.y - shoulder.y };
  
  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (mag1 === 0 || mag2 === 0) return null;
  
  const cosAngle = dotProduct / (mag1 * mag2);
  const angleRad = Math.acos(Math.max(-1.0, Math.min(1.0, cosAngle)));
  return Math.round(angleRad * (180.0 / Math.PI));
};

// Logging throttle: 30Hz = ~33.3ms interval
let lastLogTime = 0;
const LOG_INTERVAL_MS = 33.3;

const formatRuleName = (rule) => {
  if (rule === 'red_circle') return 'วงกลมสีแดง 🔴';
  if (rule === 'red_square') return 'สี่เหลี่ยมสีแดง 🟥';
  if (rule === 'blue_circle') return 'วงกลมสีน้ำเงิน 🔵';
  if (rule === 'blue_square') return 'สี่เหลี่ยมสีน้ำเงิน 🟦';
  return '';
};

// Sound & Voice Synthesis Helpers
let audioCtx = null;
const initAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const synthesizeSound = (type) => {
  try {
    initAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'hit') {
      // Ascending chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'miss') {
      // Descending low buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'ping') {
      // Clean short beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (err) {
    console.warn('Audio context synthesis failed:', err);
  }
};

const speakText = (text) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel(); // cancel previous speak to avoid overlapping
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis failed:', e);
  }
};

// Particle Class definition for Visual Feedback
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 4 + 2;
    this.speedX = Math.random() * 6 - 3;
    this.speedY = Math.random() * 6 - 3;
    this.color = color;
    this.alpha = 1.0;
    this.decay = Math.random() * 0.03 + 0.015;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.decay;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const triggerParticleBurst = (x, y, color) => {
  for (let i = 0; i < 20; i++) {
    particles.value.push(new Particle(x, y, color));
  }
};

const POSE_CONNECTIONS = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [23, 25], [25, 27], [27, 29], [27, 31],
  [24, 26], [26, 28], [28, 30], [28, 32],
  [0, 2], [2, 4], [0, 5], [5, 7], [9, 10]
];

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
];

const POSE_LANDMARK_LABELS = {
  0: 'ศีรษะ/จมูก',
  1: 'ตาซ้ายใน',
  2: 'ตาซ้าย',
  3: 'ตาซ้ายนอก',
  4: 'ตาขวาใน',
  5: 'ตาขวา',
  6: 'ตาขวานอก',
  7: 'หูซ้าย',
  8: 'หูขวา',
  9: 'ปากซ้าย',
  10: 'ปากขวา',
  11: 'ไหล่ซ้าย',
  12: 'ไหล่ขวา',
  13: 'ศอกซ้าย',
  14: 'ศอกขวา',
  15: 'ข้อมือซ้าย',
  16: 'ข้อมือขวา',
  19: 'นิ้วมือซ้าย',
  20: 'นิ้วมือขวา',
  23: 'สะโพกซ้าย',
  24: 'สะโพกขวา',
  25: 'เข่าซ้าย',
  26: 'เข่าขวา',
  27: 'ข้อเท้าซ้าย',
  28: 'ข้อเท้าขวา',
  29: 'ส้นเท้าซ้าย',
  30: 'ส้นเท้าขวา',
  31: 'ปลายเท้าซ้าย',
  32: 'ปลายเท้าขวา'
};

const toCanvasPoint = (landmark) => ({
  x: (1 - landmark.x) * CANVAS_WIDTH,
  y: landmark.y * CANVAS_HEIGHT,
  visible: landmark.visibility === undefined || landmark.visibility > 0.5
});

const drawPoseSkeleton = (ctx) => {
  if (!poseLandmarks.value.length) return;

  const points = poseLandmarks.value.map(toCanvasPoint);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  POSE_CONNECTIONS.forEach(([start, end]) => {
    const a = points[start];
    const b = points[end];
    if (!a?.visible || !b?.visible) return;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  points.forEach((point, index) => {
    if (!point.visible) return;

    const isUpperBody = [11, 12, 13, 14, 15, 16, 23, 24].includes(index);
    ctx.fillStyle = isUpperBody ? '#fbbf24' : '#38bdf8';
    ctx.strokeStyle = '#0b0f19';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(251, 191, 36, 0.3)';
    ctx.beginPath();
    ctx.arc(point.x, point.y, isUpperBody ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (POSE_LANDMARK_LABELS[index]) {
      ctx.font = "11px 'Inter', sans-serif";
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowBlur = 0;
      ctx.fillText(POSE_LANDMARK_LABELS[index], point.x + 7, point.y - 7);
    }
  });

  ctx.restore();
};

const drawPrivacyEyeMask = (ctx) => {
  if (!poseLandmarks.value.length) return;

  const points = poseLandmarks.value.map(toCanvasPoint);
  const visibleFacePoints = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    .map(index => points[index])
    .filter(point => point?.visible);

  if (visibleFacePoints.length < 2) return;

  const leftEyeCandidates = [points[1], points[2], points[3]].filter(point => point?.visible);
  const rightEyeCandidates = [points[4], points[5], points[6]].filter(point => point?.visible);
  const nose = points[0]?.visible ? points[0] : null;

  const averagePoint = (items) => ({
    x: items.reduce((sum, point) => sum + point.x, 0) / items.length,
    y: items.reduce((sum, point) => sum + point.y, 0) / items.length
  });

  const leftEye = leftEyeCandidates.length ? averagePoint(leftEyeCandidates) : null;
  const rightEye = rightEyeCandidates.length ? averagePoint(rightEyeCandidates) : null;
  const center = leftEye && rightEye
    ? { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
    : nose;

  if (!center) return;

  const xValues = visibleFacePoints.map(point => point.x);
  const yValues = visibleFacePoints.map(point => point.y);
  const faceWidth = Math.max(56, Math.max(...xValues) - Math.min(...xValues));
  const faceHeight = Math.max(22, Math.max(...yValues) - Math.min(...yValues));
  const maskWidth = Math.min(190, Math.max(74, faceWidth * 1.55));
  const maskHeight = Math.min(54, Math.max(24, faceHeight * 0.58));

  ctx.save();
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 12;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.roundRect(
    center.x - maskWidth / 2,
    center.y - maskHeight / 2,
    maskWidth,
    maskHeight,
    Math.min(12, maskHeight / 2)
  );
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f8fafc';
  ctx.font = "bold 10px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRIVACY', center.x, center.y);
  ctx.restore();
};

const getVisibleLandmark = (index, minVisibility = 0.35) => {
  const landmark = poseLandmarks.value[index];
  if (!landmark) return null;
  if (landmark.visibility !== undefined && landmark.visibility < minVisibility) return null;
  return landmark;
};

const distanceBetween = (a, b) => {
  if (!a || !b) return null;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const updatePostureStatus = () => {
  if (!poseLandmarks.value.length || !poseDetected.value) {
    postureStatus.value = 'รอตรวจจับท่าทาง';
    return;
  }

  const leftShoulder = getVisibleLandmark(11);
  const rightShoulder = getVisibleLandmark(12);
  const leftHip = getVisibleLandmark(23);
  const rightHip = getVisibleLandmark(24);
  const leftKnee = getVisibleLandmark(25, 0.25);
  const rightKnee = getVisibleLandmark(26, 0.25);
  const leftAnkle = getVisibleLandmark(27, 0.25);
  const rightAnkle = getVisibleLandmark(28, 0.25);

  const shoulderHip = distanceBetween(leftShoulder, leftHip) || distanceBetween(rightShoulder, rightHip);
  const hipKnee = distanceBetween(leftHip, leftKnee) || distanceBetween(rightHip, rightKnee);
  const kneeAnkle = distanceBetween(leftKnee, leftAnkle) || distanceBetween(rightKnee, rightAnkle);
  const hipAnkle = distanceBetween(leftHip, leftAnkle) || distanceBetween(rightHip, rightAnkle);

  if (!shoulderHip || !hipKnee) {
    const nose = getVisibleLandmark(0);
    if (nose && (leftShoulder || rightShoulder)) {
      const avgShoulderY = (leftShoulder && rightShoulder) ? (leftShoulder.y + rightShoulder.y) / 2 : (leftShoulder?.y || rightShoulder?.y);
      const neckYDiff = avgShoulderY - nose.y;
      if (neckYDiff > 0.16 || avgShoulderY > 0.46) {
        postureStatus.value = 'ยืนอยู่ (ตรวจจากส่วนบน)';
      } else {
        postureStatus.value = 'นั่งอยู่ (ตรวจจากส่วนบน)';
      }
      return;
    }
    postureStatus.value = 'เห็นลำตัวบางส่วน';
    return;
  }

  const legExtensionRatio = hipAnkle && hipKnee && kneeAnkle ? hipAnkle / (hipKnee + kneeAnkle) : 0;
  const kneeLowerThanHip = (leftHip && leftKnee && leftKnee.y > leftHip.y + 0.08) ||
    (rightHip && rightKnee && rightKnee.y > rightHip.y + 0.08);

  if (legExtensionRatio > 0.72 && kneeLowerThanHip) {
    postureStatus.value = 'ยืนอยู่';
  } else if (kneeLowerThanHip) {
    postureStatus.value = 'นั่งอยู่';
  } else {
    postureStatus.value = 'กำลังจัดท่าทาง';
  }

  // Detect shoulder tilt (compensation check)
  if (leftShoulder && rightShoulder) {
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderTilt > 0.08) {
      isCompensating.value = true;
      postureStatus.value += ' (ชดเชยไหล่เอียง)';
    } else {
      isCompensating.value = false;
    }
  } else {
    isCompensating.value = false;
  }
};

const resetRecordingState = () => {
  if (currentRecordingUrl) {
    URL.revokeObjectURL(currentRecordingUrl);
    currentRecordingUrl = null;
  }
  recordedChunks = [];
  mediaRecorder = null;
  isRecordingVideo.value = false;
  recordingStatus.value = 'ยังไม่เริ่มบันทึก';
};

const startSessionRecording = () => {
  if (!canvasElement.value?.captureStream || typeof MediaRecorder === 'undefined') {
    recordingStatus.value = 'เบราว์เซอร์นี้ไม่รองรับการบันทึกวิดีโอ';
    return;
  }

  resetRecordingState();

  try {
    const stream = canvasElement.value.captureStream(30);
    const supportedTypes = [
      'video/mp4;codecs=h264',
      'video/mp4;codecs=vp9',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      isRecordingVideo.value = false;
      saveRecordingToComputer();
    };

    mediaRecorder.start(1000);
    isRecordingVideo.value = true;
    recordingStatus.value = 'กำลังบันทึกวิดีโอการทดสอบ';
  } catch (error) {
    console.error('Video recording failed:', error);
    recordingStatus.value = 'เริ่มบันทึกวิดีโอไม่สำเร็จ';
    isRecordingVideo.value = false;
  }
};

const stopSessionRecording = () => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    isRecordingVideo.value = false;
    return;
  }

  try {
    recordingStatus.value = 'กำลังเตรียมไฟล์วิดีโอ';
    mediaRecorder.stop();
  } catch (error) {
    console.error('Stopping video recording failed:', error);
    recordingStatus.value = 'หยุดบันทึกวิดีโอไม่สำเร็จ';
    isRecordingVideo.value = false;
  }
};

const saveRecordingToComputer = () => {
  if (!recordedChunks.length) {
    recordingStatus.value = 'ไม่มีข้อมูลวิดีโอให้บันทึก';
    return;
  }

  let mimeType = 'video/mp4';
  if (mediaRecorder && mediaRecorder.mimeType && MediaRecorder.isTypeSupported(mediaRecorder.mimeType)) {
    if (mediaRecorder.mimeType.includes('mp4')) {
      mimeType = mediaRecorder.mimeType;
    }
  }

  const blob = new Blob(recordedChunks, { type: mimeType });
  currentRecordingUrl = URL.createObjectURL(blob);
  const patientId = patientForm.patientId || 'patient';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `RIT-${patientId}-${timestamp}.mp4`;
  const link = document.createElement('a');
  link.href = currentRecordingUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  recordingStatus.value = `บันทึกไฟล์แล้ว: ${filename}`;
};

const drawHandSkeletons = (ctx) => {
  if (!handLandmarks.value.length) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  handLandmarks.value.forEach((hand) => {
    const points = hand.landmarks.map(toCanvasPoint);
    const color = hand.side === 'left' ? '#818cf8' : '#c084fc';
    const glow = hand.side === 'left' ? 'rgba(129, 140, 248, 0.55)' : 'rgba(192, 132, 252, 0.55)';

    HAND_CONNECTIONS.forEach(([start, end]) => {
      const a = points[start];
      const b = points[end];
      if (!a || !b) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = glow;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    points.forEach((point, index) => {
      ctx.fillStyle = index === 0 || index === 8 ? '#34d399' : color;
      ctx.strokeStyle = '#0b0f19';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, index === 8 ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    const wrist = points[0];
    if (wrist) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f8fafc';
      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(hand.side === 'left' ? 'มือซ้าย' : 'มือขวา', wrist.x + 8, wrist.y - 8);
    }
  });

  ctx.restore();
};

const cancelAutoStartCountdown = () => {
  if (autoStartTimerId) {
    clearInterval(autoStartTimerId);
    autoStartTimerId = null;
  }
  autoStartCountdown.value = 0;
};

const beginAutoStartCountdown = () => {
  if (autoStartTimerId || gameState.value !== 'calibrating') return;

  autoStartCountdown.value = 3;
  speakText("เตรียมตัว สาม");
  autoStartTimerId = setInterval(() => {
    const handsReady = processedFrameCount.value > 0 && isLeftFingerInRestZone.value && isRightFingerInRestZone.value;
    if (!handsReady || gameState.value !== 'calibrating') {
      cancelAutoStartCountdown();
      return;
    }

    autoStartCountdown.value -= 1;
    if (autoStartCountdown.value <= 0) {
      clearInterval(autoStartTimerId);
      autoStartTimerId = null;
      startGame();
    } else {
      if (autoStartCountdown.value === 2) speakText("สอง");
      else if (autoStartCountdown.value === 1) speakText("หนึ่ง");
    }
  }, 1000);
};

const updateAutoStartCountdown = () => {
  if (gameState.value !== 'calibrating' || loadingModel.value || runtimeError.value) {
    cancelAutoStartCountdown();
    return;
  }

  const handsReady = processedFrameCount.value > 0 && isLeftFingerInRestZone.value && isRightFingerInRestZone.value;
  if (handsReady) {
    beginAutoStartCountdown();
  } else {
    cancelAutoStartCountdown();
  }
};

const hasAvailableCamera = () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    runtimeError.value = 'เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง กรุณาเปิดด้วย Chrome, Edge หรือ Safari เวอร์ชันล่าสุด';
    return false;
  }

  return true;
};

const startCalibration = async () => {
  enterFullscreen();
  gameState.value = 'calibrating';
  loadingModel.value = true;
  runtimeError.value = '';
  modelError.value = '';
  processedFrameCount.value = 0;
  lastDetectionMessage.value = 'กำลังเตรียมโมเดลตรวจจับ';
  cancelAutoStartCountdown();

  speakText("กรุณาจัดวางท่าทาง และวางมือในโซนพักเพื่อเริ่มการประเมินค่ะ");

  const cameraReady = hasAvailableCamera();
  if (!cameraReady) {
    loadingModel.value = false;
    return;
  }
  
  await nextTick();
  initMediaPipe();
};

const getCameraErrorMessage = (error) => {
  const name = error?.name || '';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'ไม่พบอุปกรณ์กล้องในเครื่องนี้ กรุณาเชื่อมต่อเว็บแคม ตรวจสอบว่าเปิดกล้องในระบบปฏิบัติการแล้ว หรือเปิดผ่านเบราว์เซอร์ภายนอกที่เข้าถึงกล้องได้';
  }
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'เบราว์เซอร์ยังไม่ได้รับสิทธิ์ใช้กล้อง กรุณากดอนุญาตกล้อง หรือเปิดสิทธิ์ Camera ให้เว็บไซต์นี้ในการตั้งค่าเบราว์เซอร์';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'กล้องถูกใช้งานโดยโปรแกรมอื่นหรือระบบไม่สามารถเปิดกล้องได้ กรุณาปิด Zoom/Meet/แอปกล้องอื่นแล้วลองใหม่';
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'กล้องที่พบไม่รองรับค่าภาพที่ร้องขอ กรุณาลองใช้กล้องตัวอื่นหรือรีเฟรชหน้าแล้วลองใหม่';
  }
  return 'ไม่สามารถเข้าถึงกล้องถ่ายภาพได้ กรุณาตรวจสอบกล้องและสิทธิ์การใช้งานในเบราว์เซอร์แล้วลองใหม่';
};

const retryCamera = async () => {
  stopAllTimers();
  runtimeError.value = '';
  loadingModel.value = true;
  const cameraReady = hasAvailableCamera();
  if (!cameraReady) {
    loadingModel.value = false;
    return;
  }
  await nextTick();
  initMediaPipe();
};

const initMediaPipe = async () => {
  if (!window.Hands || !window.Pose) {
    loadingModel.value = false;
    runtimeError.value = 'ไม่พบ MediaPipe Hands/Pose กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง';
    return;
  }

  handsInstance = new window.Hands({
    locateFile: (file) => `https://unpkg.com/@mediapipe/hands/${file}`
  });

  handsInstance.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.25,
    minTrackingConfidence: 0.25
  });

  handsInstance.onResults(onHandResults);

  poseInstance = new window.Pose({
    locateFile: (file) => `https://unpkg.com/@mediapipe/pose/${file}`
  });

  poseInstance.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.25,
    minTrackingConfidence: 0.25
  });

  poseInstance.onResults(onPoseResults);

  try {
    if (handsInstance.initialize) await handsInstance.initialize();
    if (poseInstance.initialize) await poseInstance.initialize();
    modelError.value = '';
  } catch (error) {
    console.error('MediaPipe model initialization failed:', error);
    loadingModel.value = false;
    runtimeError.value = 'โหลดโมเดลตรวจจับมือ/สรีระไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    return;
  }

  startCameraStream();
};

const startCameraStream = async () => {
  if (!videoElement.value) return;

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    });

    videoElement.value.srcObject = cameraStream;
    await new Promise((resolve) => {
      if (videoElement.value.readyState >= 2) {
        resolve();
        return;
      }
      videoElement.value.onloadedmetadata = () => resolve();
    });
    await videoElement.value.play();
    cameraReady.value = true;
    loadingModel.value = false;
    startCanvasLoop();
  } catch (err) {
    console.error("Camera access failed:", err);
    cameraReady.value = false;
    loadingModel.value = false;
    runtimeError.value = getCameraErrorMessage(err);
  }
};

const onPoseResults = (results) => {
  if (results.poseLandmarks && results.poseLandmarks.length > 0) {
    poseLandmarks.value = results.poseLandmarks;
    visiblePoseLandmarkCount.value = results.poseLandmarks.filter(
      landmark => landmark.visibility === undefined || landmark.visibility > 0.5
    ).length;
    poseDetected.value = visiblePoseLandmarkCount.value >= 8;
  } else {
    poseLandmarks.value = [];
    visiblePoseLandmarkCount.value = 0;
    poseDetected.value = false;
  }

  updatePostureStatus();
  updateDetectionMessage();
};

const onHandResults = (results) => {
  leftHandDetected.value = false;
  rightHandDetected.value = false;
  isLeftFingerInRestZone.value = false;
  isRightFingerInRestZone.value = false;
  handLandmarks.value = [];

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    handDetected.value = true;

    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const tip = landmarks[8];
      const canvasX = (1 - tip.x) * CANVAS_WIDTH;
      const canvasY = tip.y * CANVAS_HEIGHT;
      const side = canvasX < CANVAS_WIDTH / 2 ? 'left' : 'right';

      handLandmarks.value.push({ side, landmarks });

      if (side === 'left') {
        leftFingerCoords.x = canvasX;
        leftFingerCoords.y = canvasY;
        leftFingerZ.value = tip.z;
        leftHandDetected.value = true;

        const spas = calculateHandSpasticity(landmarks);
        leftHandSpasticity.value = spas.status;
        leftHandSpasticityScore.value = spas.score;

        isLeftFingerInRestZone.value = 
          canvasX >= leftRestZone.x &&
          canvasX <= leftRestZone.x + leftRestZone.width &&
          canvasY >= leftRestZone.y &&
          canvasY <= leftRestZone.y + leftRestZone.height;
      } else {
        rightFingerCoords.x = canvasX;
        rightFingerCoords.y = canvasY;
        rightFingerZ.value = tip.z;
        rightHandDetected.value = true;

        const spas = calculateHandSpasticity(landmarks);
        rightHandSpasticity.value = spas.status;
        rightHandSpasticityScore.value = spas.score;

        isRightFingerInRestZone.value = 
          canvasX >= rightRestZone.x &&
          canvasX <= rightRestZone.x + rightRestZone.width &&
          canvasY >= rightRestZone.y &&
          canvasY <= rightRestZone.y + rightRestZone.height;
      }
    }
  } else {
    handDetected.value = false;
  }

  updateDetectionMessage();
  updateAutoStartCountdown();
};

const updateDetectionMessage = () => {
  if (!cameraReady.value) {
    lastDetectionMessage.value = 'รอเชื่อมต่อกล้อง';
    return;
  }
  if (leftHandDetected.value && rightHandDetected.value && poseDetected.value) {
    lastDetectionMessage.value = 'จับจุดมือและสรีระสำเร็จ';
    return;
  }
  if (handDetected.value || poseDetected.value) {
    lastDetectionMessage.value = 'จับจุดได้บางส่วน กรุณาจัดมือ แขน และลำตัวให้อยู่ในกรอบ';
    return;
  }
  lastDetectionMessage.value = 'กำลังสแกนมือ แขน และลำตัว';
};

const startGame = () => {
  enterFullscreen();
  cancelAutoStartCountdown();
  gameState.value = 'playing';
  timeLeft.value = 60;
  sessionLogs.value = [];
  rollingOutcomes.value = [];
  activeTarget.value = null;
  lastResolvedTarget = null;
  particles.value = [];
  stateMachineState.value = 'resting';
  
  speakText("เริ่มการประเมินได้ค่ะ");

  currentTargetSpeed.value = BASE_SPEED;
  currentSpawnInterval.value = BASE_SPAWN_INTERVAL;
  startSessionRecording();

  // Game Duration Timer (60s)
  gameTimerId = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      endSession();
    }
  }, 1000);

  // Difficulty scaling check: every 5 seconds
  difficultyScalerIntervalId = setInterval(runDifficultyScaling, 5000);

  scheduleNextTarget();
};

const runDifficultyScaling = () => {
  const now = Date.now();
  const recent = rollingOutcomes.value.filter(o => now - o.timestamp <= 5000);
  
  if (recent.length === 0) return;

  const hits = recent.filter(o => o.hit).length;
  const rate = hits / recent.length;

  if (rate > 0.8) {
    // Increase difficulty by 10%
    currentTargetSpeed.value = Math.min(8.0, currentTargetSpeed.value * 1.1);
    currentSpawnInterval.value = Math.max(1500, currentSpawnInterval.value * 0.9);
  } else if (rate < 0.4) {
    // Decrease difficulty by 10%
    currentTargetSpeed.value = Math.max(2.0, currentTargetSpeed.value * 0.9);
    currentSpawnInterval.value = Math.min(5000, currentSpawnInterval.value * 1.1);
  }
};

const scheduleNextTarget = () => {
  if (gameState.value !== 'playing') return;
  if (targetSpawnTimerId) clearTimeout(targetSpawnTimerId);
  
  const jitter = Math.random() * 1000 - 500;
  const delay = Math.max(1000, currentSpawnInterval.value + jitter);
  targetSpawnTimerId = setTimeout(() => {
    targetSpawnTimerId = null;
    spawnTarget();
  }, delay);
};

const spawnTarget = () => {
  if (gameState.value !== 'playing' || activeTarget.value) return;

  let requiredHand = 'any';
  let side = 'any';
  let spawnX = 0;
  let spawnY = 0;
  let vx = 0;
  let vy = 0;
  
  if (gameMode.value === 'forced') {
    requiredHand = patientForm.affectedSide;
    side = requiredHand;
    spawnX = side === 'left' ? -targetRadius : CANVAS_WIDTH + targetRadius;
    spawnY = Math.random() * (CANVAS_HEIGHT - 220) + 80;
    vx = side === 'left' ? currentTargetSpeed.value : -currentTargetSpeed.value;
    vy = 0;
  } else if (gameMode.value === 'bilateral') {
    requiredHand = 'both';
    side = 'center';
    spawnX = CANVAS_WIDTH / 2;
    spawnY = -targetRadius;
    vx = 0;
    vy = currentTargetSpeed.value * 0.75;
  } else if (gameMode.value === 'range_of_motion') {
    requiredHand = Math.random() > 0.5 ? 'left' : 'right';
    side = requiredHand;
    spawnX = side === 'left' ? -targetRadius : CANVAS_WIDTH + targetRadius;
    spawnY = Math.random() > 0.5 ? (Math.random() * 40 + 40) : (Math.random() * 40 + CANVAS_HEIGHT - 130);
    vx = side === 'left' ? currentTargetSpeed.value * 0.8 : -currentTargetSpeed.value * 0.8;
    vy = 0;
  } else if (gameMode.value === 'diagnostic') {
    const randType = Math.floor(Math.random() * 4);
    if (randType === 0) { // Forced style
      requiredHand = patientForm.affectedSide;
      side = requiredHand;
      spawnX = side === 'left' ? -targetRadius : CANVAS_WIDTH + targetRadius;
      spawnY = Math.random() * (CANVAS_HEIGHT - 220) + 80;
      vx = side === 'left' ? currentTargetSpeed.value : -currentTargetSpeed.value;
      vy = 0;
    } else if (randType === 1) { // Bilateral style
      requiredHand = 'both';
      side = 'center';
      spawnX = CANVAS_WIDTH / 2;
      spawnY = -targetRadius;
      vx = 0;
      vy = currentTargetSpeed.value * 0.75;
    } else if (randType === 2) { // ROM style
      requiredHand = Math.random() > 0.5 ? 'left' : 'right';
      side = requiredHand;
      spawnX = side === 'left' ? -targetRadius : CANVAS_WIDTH + targetRadius;
      spawnY = Math.random() > 0.5 ? (Math.random() * 40 + 40) : (Math.random() * 40 + CANVAS_HEIGHT - 130);
      vx = side === 'left' ? currentTargetSpeed.value * 0.8 : -currentTargetSpeed.value * 0.8;
      vy = 0;
    } else { // Cognitive style
      requiredHand = 'any';
      side = Math.random() > 0.5 ? 'left' : 'right';
      spawnX = side === 'left' ? -targetRadius : CANVAS_WIDTH + targetRadius;
      spawnY = Math.random() * (CANVAS_HEIGHT - 220) + 80;
      vx = side === 'left' ? currentTargetSpeed.value : -currentTargetSpeed.value;
      vy = 0;
    }
  } else {
    side = requiredHand === 'any' ? (Math.random() > 0.5 ? 'left' : 'right') : requiredHand;
    spawnX = side === 'left' ? -targetRadius : CANVAS_WIDTH + targetRadius;
    spawnY = Math.random() * (CANVAS_HEIGHT - 220) + 80;
    vx = side === 'left' ? currentTargetSpeed.value : -currentTargetSpeed.value;
    vy = 0;
  }
  
  // Handle cognitive match mode rule properties
  let colorName = 'red';
  let shape = 'circle';
  let isCorrectTarget = true;
  
  if (gameMode.value === 'cognitive_match') {
    const [ruleColor, ruleShape] = activeCognitiveRule.value.split('_');
    const spawnCorrect = Math.random() < 0.65;
    if (spawnCorrect) {
      colorName = ruleColor;
      shape = ruleShape;
      isCorrectTarget = true;
    } else {
      const colors = ['red', 'blue'];
      const shapes = ['circle', 'square'];
      colorName = colors[Math.floor(Math.random() * colors.length)];
      shape = shapes[Math.floor(Math.random() * shapes.length)];
      if (colorName === ruleColor && shape === ruleShape) {
        colorName = ruleColor === 'red' ? 'blue' : 'red';
      }
      isCorrectTarget = false;
    }
  } else {
    const props = createTargetCognitiveProperties();
    colorName = props.colorName;
    shape = props.shape;
    isCorrectTarget = props.isCorrectTarget;
  }

  activeTarget.value = {
    x: spawnX,
    y: spawnY,
    vx,
    vy,
    side,
    spawnTime: Date.now(),
    requiredHand,
    shape,
    color: colorName,
    isCorrectTarget,
    outcome: null
  };

  const currentResting = isLeftFingerInRestZone.value && isRightFingerInRestZone.value;
  stateMachineState.value = currentResting ? 'resting' : 'moving';
};

// Canvas animation loop
const startCanvasLoop = () => {
  const ctx = canvasElement.value.getContext('2d');
  
  const draw = async (timestamp) => {
    if (gameState.value === 'setup' || !canvasElement.value) return;

    // Dark-mode background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw webcam feed mirrored. Keep calibration bright so users can verify camera framing.
    if (videoElement.value && (videoElement.value.readyState >= 2 || videoElement.value.videoWidth > 0)) {
      const now = Date.now();
      
      // 1. Hands Tracking (Throttled to 85ms - approx 12 FPS, very smooth for interactive gameplay)
      if (!isProcessingHands && (now - lastHandsProcessTime > 85) && (gameState.value === 'calibrating' || gameState.value === 'playing')) {
        isProcessingHands = true;
        lastHandsProcessTime = now;
        
        const handsTimeoutId = setTimeout(() => {
          if (isProcessingHands) {
            isProcessingHands = false;
          }
        }, 200);

        handsInstance.send({ image: videoElement.value })
          .then(() => {
            processedFrameCount.value += 1;
            modelError.value = '';
          })
          .catch(error => {
            console.error('Hands tracking failed:', error);
          })
          .finally(() => {
            clearTimeout(handsTimeoutId);
            isProcessingHands = false;
          });
      }

      // 2. Pose/Posture/Shoulder ROM Tracking (Throttled to 350ms - 3 FPS is perfectly sufficient for slow joints/postures)
      if (!isProcessingPose && (now - lastPoseProcessTime > 350) && (gameState.value === 'calibrating' || gameState.value === 'playing')) {
        isProcessingPose = true;
        lastPoseProcessTime = now;
        
        const poseTimeoutId = setTimeout(() => {
          if (isProcessingPose) {
            isProcessingPose = false;
          }
        }, 500);

        poseInstance.send({ image: videoElement.value })
          .catch(error => {
            console.error('Pose tracking failed:', error);
          })
          .finally(() => {
            clearTimeout(poseTimeoutId);
            isProcessingPose = false;
          });
      }

      ctx.save();
      ctx.translate(CANVAS_WIDTH, 0);
      ctx.scale(-1, 1);
      ctx.globalAlpha = gameState.value === 'calibrating' ? 0.82 : 0.35;
      ctx.drawImage(videoElement.value, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();

      if (gameState.value === 'calibrating') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
        ctx.lineWidth = 1;
        ctx.roundRect(16, 16, 190, 34, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText('กล้องเชื่อมต่อแล้ว', 32, 38);
        ctx.restore();
      }
    }

    // 2. Draw full-body pose landmarks and skeleton
    drawPoseSkeleton(ctx);
    drawHandSkeletons(ctx);
    drawPrivacyEyeMask(ctx);

    if (gameState.value === 'calibrating') {
      ctx.save();
      const statusColor = leftHandDetected.value && rightHandDetected.value && poseDetected.value ? '#34d399' : '#fbbf24';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.strokeStyle = leftHandDetected.value && rightHandDetected.value && poseDetected.value ? 'rgba(52, 211, 153, 0.55)' : 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1;
      ctx.roundRect(16, 58, 360, 42, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = statusColor;
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(lastDetectionMessage.value, 32, 84);
      if (modelError.value) {
        ctx.fillStyle = '#fb7185';
        ctx.fillText(modelError.value, 32, 104);
      }
      ctx.restore();
    }

    // Broadcast live telemetry data to window object for doctor observation console
    window.__lastLiveTelemetry = {
      timestamp: Date.now(),
      postureStatus: postureStatus.value,
      isCompensating: isCompensating.value,
      leftFingerZ: leftFingerZ.value,
      leftHandSpasticityScore: leftHandSpasticityScore.value,
      leftHandSpasticity: leftHandSpasticity.value,
      leftHandDetected: leftHandDetected.value,
      rightFingerZ: rightFingerZ.value,
      rightHandSpasticityScore: rightHandSpasticityScore.value,
      rightHandSpasticity: rightHandSpasticity.value,
      rightHandDetected: rightHandDetected.value,
      leftShoulderAngle: leftShoulderAngle.value,
      rightShoulderAngle: rightShoulderAngle.value,
      currentHeartRate: currentHeartRate.value,
      bleConnected: bleConnected.value,
      bleDeviceName: bleDeviceName.value,
      gameMode: gameMode.value,
      score: score.value,
      timeLeft: timeLeft.value,
      targetsHit: targetsHit.value
    };

    // 3. Draw Left & Right Rest Zones
    ctx.save();
    ctx.shadowBlur = 15;
    
    // Left Zone
    if (isLeftFingerInRestZone.value) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
    } else {
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.6)';
      ctx.fillStyle = 'rgba(13, 148, 136, 0.05)';
      ctx.shadowColor = 'rgba(13, 148, 136, 0.2)';
    }
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(leftRestZone.x, leftRestZone.y, leftRestZone.width, leftRestZone.height, 12);
    ctx.stroke();
    ctx.fill();

    // Right Zone
    if (isRightFingerInRestZone.value) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
    } else {
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.6)';
      ctx.fillStyle = 'rgba(13, 148, 136, 0.05)';
      ctx.shadowColor = 'rgba(13, 148, 136, 0.2)';
    }
    ctx.beginPath();
    ctx.roundRect(rightRestZone.x, rightRestZone.y, rightRestZone.width, rightRestZone.height, 12);
    ctx.stroke();
    ctx.fill();
    ctx.restore();

    // Rest Zone Labels
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.textAlign = 'center';
    
    ctx.fillStyle = isLeftFingerInRestZone.value ? '#34d399' : '#2dd4bf';
    ctx.fillText("โซนพักมือซ้าย", leftRestZone.x + leftRestZone.width / 2, leftRestZone.y + leftRestZone.height / 2 + 5);
    
    ctx.fillStyle = isRightFingerInRestZone.value ? '#34d399' : '#2dd4bf';
    ctx.fillText("โซนพักมือขวา", rightRestZone.x + rightRestZone.width / 2, rightRestZone.y + rightRestZone.height / 2 + 5);

    // Update shoulder angles
    leftShoulderAngle.value = calculateShoulderAngle('left');
    rightShoulderAngle.value = calculateShoulderAngle('right');
    
    // Draw shoulder angles on screen for feedback in Range of Motion mode
    if (poseDetected.value) {
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.font = "bold 13px 'Courier New', sans-serif";
      ctx.textAlign = 'center';
      
      const leftShoulderPoint = getVisibleLandmark(11);
      if (leftShoulderPoint) {
        const cp = toCanvasPoint(leftShoulderPoint);
        ctx.fillText(`L: ${leftShoulderAngle.value || '--'}°`, cp.x, cp.y - 15);
      }
      const rightShoulderPoint = getVisibleLandmark(12);
      if (rightShoulderPoint) {
        const cp = toCanvasPoint(rightShoulderPoint);
        ctx.fillText(`R: ${rightShoulderAngle.value || '--'}°`, cp.x, cp.y - 15);
      }
      ctx.restore();
    }

    // Shift cognitive rule every 8 seconds in matching mode
    if (gameState.value === 'playing' && gameMode.value === 'cognitive_match') {
      const ruleInterval = 8; // seconds
      const elapsed = 60 - timeLeft.value;
      const rules = ['red_circle', 'red_square', 'blue_circle', 'blue_square'];
      const newRule = rules[Math.floor(elapsed / ruleInterval) % rules.length];
      if (activeCognitiveRule.value !== newRule) {
        activeCognitiveRule.value = newRule;
        triggerParticleBurst(CANVAS_WIDTH / 2, 60, '#f59e0b');
        synthesizeSound('ping');
        speakText(`เปลี่ยนกฎเป้าหมาย สกัดกั้นเฉพาะ ${formatRuleName(newRule).replace('🔴','').replace('🟥','').replace('🔵','').replace('🟦','')} ค่ะ`);
      }
      
      // Draw HUD Banner for Cognitive Match
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - 200, 20, 400, 40, 6);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 16px 'Courier New', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`เป้าหมาย: ${formatRuleName(activeCognitiveRule.value)}`, CANVAS_WIDTH / 2, 40);
      ctx.restore();
    }

    // 4. Update & Draw Target
    let detectedHandHit = 'none';
    if (activeTarget.value) {
      const target = activeTarget.value;
      target.x += target.vx;
      target.y += target.vy; // Support vertical movement for bilateral

      // Draw Target (Circle or Square)
      ctx.save();
      ctx.shadowBlur = 20;
      
      const neonColor = target.color === 'red' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)';
      ctx.shadowColor = neonColor;
      ctx.fillStyle = target.color === 'red' ? '#ef4444' : '#3b82f6';
      ctx.strokeStyle = target.isCorrectTarget ? '#f8fafc' : 'rgba(248, 250, 252, 0.35)';
      ctx.lineWidth = target.isCorrectTarget ? 4 : 2;
      
      // Special border styling for Bilateral target
      if (target.requiredHand === 'both') {
        ctx.strokeStyle = '#eab308'; // Glowing gold border
        ctx.lineWidth = 5;
      }
      
      ctx.beginPath();
      if (target.shape === 'circle') {
        ctx.arc(target.x, target.y, targetRadius, 0, Math.PI * 2);
      } else {
        ctx.rect(target.x - targetRadius, target.y - targetRadius, targetRadius * 2, targetRadius * 2);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 15px 'Outfit', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (target.requiredHand === 'both') {
        ctx.fillText('ใช้ 2 มือ!', target.x, target.y);
      } else {
        ctx.fillText(target.color === 'red' ? 'แดง' : 'น้ำเงิน', target.x, target.y);
      }
      ctx.restore();

      // Check collision with BOTH fingers
      let leftCollides = false;
      let rightCollides = false;
      
      ['left', 'right'].forEach(hand => {
        const finger = hand === 'left' ? leftFingerCoords : rightFingerCoords;
        const detected = hand === 'left' ? leftHandDetected.value : rightHandDetected.value;
        
        if (detected) {
          const dx = finger.x - target.x;
          const dy = finger.y - target.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= targetRadius + fingerIndicatorRadius) {
            if (hand === 'left') leftCollides = true;
            if (hand === 'right') rightCollides = true;
          }
        }
      });
      
      if (target.requiredHand === 'both') {
        if (leftCollides && rightCollides) {
          detectedHandHit = 'both';
        } else if (leftCollides || rightCollides) {
          // Partial hit: visual cue to use both hands
          ctx.save();
          ctx.fillStyle = '#ef4444';
          ctx.font = "bold 16px 'Outfit', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText("กรุณาใช้ทั้งสองมือ!", target.x, target.y - targetRadius - 15);
          ctx.restore();
          
          if (!target._warnedBilateral || Date.now() - target._warnedBilateral > 1500) {
            target._warnedBilateral = Date.now();
            speakText("กรุณาใช้ทั้งสองมือค่ะ");
          }
        }
      } else {
        if (leftCollides) detectedHandHit = 'left';
        else if (rightCollides) detectedHandHit = 'right';
      }

      if (detectedHandHit !== 'none') {
        const usedRequiredHand = target.requiredHand === 'any' || detectedHandHit === target.requiredHand;
        const isValidHit = target.isCorrectTarget && usedRequiredHand;
        stateMachineState.value = 'hit';
        target.outcome = 'hit';
        target.usedHand = detectedHandHit;
        lastResolvedTarget = { ...target };

        if (isValidHit) {
          const colorHex = target.color === 'red' ? '#f87171' : '#60a5fa';
          triggerParticleBurst(target.x, target.y, colorHex);
          synthesizeSound('hit');
        } else {
          synthesizeSound('miss');
        }

        // Track rolling outcomes for adaptive scaling
        rollingOutcomes.value.push({ timestamp: Date.now(), hit: isValidHit });

        activeTarget.value = null;
        scheduleNextTarget();
      } else if ((target.vx > 0 && target.x > CANVAS_WIDTH + targetRadius) ||
                 (target.vx < 0 && target.x < -targetRadius) ||
                 (target.vy > 0 && target.y > CANVAS_HEIGHT + targetRadius)) {
        stateMachineState.value = 'miss';
        target.outcome = 'miss';
        target.usedHand = 'none';
        lastResolvedTarget = { ...target };

        // Missed correct target counts negatively for rolling scale
        if (target.isCorrectTarget) {
          rollingOutcomes.value.push({ timestamp: Date.now(), hit: false });
          synthesizeSound('miss');
        }

        activeTarget.value = null;
        scheduleNextTarget();
      }
    }

    // 5. Update & Draw Particles
    for (let i = particles.value.length - 1; i >= 0; i--) {
      const p = particles.value[i];
      p.update();
      if (p.alpha <= 0) {
        particles.value.splice(i, 1);
      } else {
        p.draw(ctx);
      }
    }

    // 6. Draw Index Finger Position Cursors
    if (leftHandDetected.value) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.7)'; // Indigo Left
      ctx.fillStyle = '#818cf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(leftFingerCoords.x, leftFingerCoords.y, fingerIndicatorRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (rightHandDetected.value) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(167, 139, 250, 0.7)'; // Purple Right
      ctx.fillStyle = '#c084fc';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rightFingerCoords.x, rightFingerCoords.y, fingerIndicatorRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 7. State Machine Transition & Data Logging (30Hz Telemetry)
    if (gameState.value === 'playing') {
      const now = Date.now();
      const currentResting = isLeftFingerInRestZone.value && isRightFingerInRestZone.value;
      
      if (lastResolvedTarget) {
        stateMachineState.value = lastResolvedTarget.outcome;
      } else if (activeTarget.value) {
        if (currentResting) {
          stateMachineState.value = 'resting';
        } else {
          if (stateMachineState.value === 'resting') {
            stateMachineState.value = 'moving';
          }
        }
      } else {
        stateMachineState.value = currentResting ? 'resting' : 'moving';
      }

      if (now - lastLogTime >= LOG_INTERVAL_MS) {
        const logTarget = activeTarget.value || lastResolvedTarget;
        sessionLogs.value.push({
          timestamp: now,
          targetX: logTarget ? Math.round(logTarget.x) : 0,
          targetY: logTarget ? Math.round(logTarget.y) : 0,
          targetShape: logTarget ? logTarget.shape : 'none',
          targetColor: logTarget ? logTarget.color : 'none',
          isCorrectTarget: logTarget ? logTarget.isCorrectTarget : true,
          requiredHand: logTarget ? logTarget.requiredHand : 'any',
           leftFingerX: leftHandDetected.value ? Math.round(leftFingerCoords.x) : 0,
          leftFingerY: leftHandDetected.value ? Math.round(leftFingerCoords.y) : 0,
          leftFingerZ: leftHandDetected.value ? Number(leftFingerZ.value.toFixed(4)) : 0,
          rightFingerX: rightHandDetected.value ? Math.round(rightFingerCoords.x) : 0,
          rightFingerY: rightHandDetected.value ? Math.round(rightFingerCoords.y) : 0,
          rightFingerZ: rightHandDetected.value ? Number(rightFingerZ.value.toFixed(4)) : 0,
          leftSpasticityScore: leftHandDetected.value ? leftHandSpasticityScore.value : 0,
          rightSpasticityScore: rightHandDetected.value ? rightHandSpasticityScore.value : 0,
          leftShoulderAngle: leftShoulderAngle.value,
          rightShoulderAngle: rightShoulderAngle.value,
          compensatoryMovement: isCompensating.value,
          heartRate: currentHeartRate.value,
          usedHand: detectedHandHit !== 'none' ? detectedHandHit : 'none',
          postureStatus: postureStatus.value,
          state: stateMachineState.value
        });
        
        lastLogTime = now;
        if (!activeTarget.value && lastResolvedTarget) {
          lastResolvedTarget = null;
        }
      }
    }

    animationFrameId = requestAnimationFrame(draw);
  };

  animationFrameId = requestAnimationFrame(draw);
};

const abortSession = () => {
  exitFullscreen();
  stopSessionRecording();
  stopAllTimers();
  stopCameraStream();
  gameState.value = 'setup';
  sessionLogs.value = [];
  activeTarget.value = null;
  lastResolvedTarget = null;
  runtimeError.value = '';
  autoStartCountdown.value = 0;
  modelError.value = '';
  processedFrameCount.value = 0;
  cameraReady.value = false;
  poseLandmarks.value = [];
  poseDetected.value = false;
  visiblePoseLandmarkCount.value = 0;
  postureStatus.value = 'รอตรวจจับท่าทาง';
};

const stopAllTimers = () => {
  if (gameTimerId) clearInterval(gameTimerId);
  if (targetSpawnTimerId) clearTimeout(targetSpawnTimerId);
  if (difficultyScalerIntervalId) clearInterval(difficultyScalerIntervalId);
  if (autoStartTimerId) clearInterval(autoStartTimerId);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  autoStartTimerId = null;
  isProcessingHands = false;
  isProcessingPose = false;
};

const stopCameraStream = () => {
  if (cameraHelper) {
    try {
      cameraHelper.stop();
    } catch (e) {}
    cameraHelper = null;
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
  cameraReady.value = false;
};

const endSession = async () => {
  exitFullscreen();
  stopSessionRecording();
  stopAllTimers();
  gameState.value = 'submitting';

  speakText("เสร็จสิ้นการประเมินแล้วค่ะ กำลังวิเคราะห์ผลลัพธ์จลนศาสตร์");

  stopCameraStream();

  // Calculate session metrics using MedicalAssessmentEngine
  const analysis = MedicalAssessmentEngine.analyze(sessionLogs.value, {
    affectedSide: patientForm.affectedSide
  });

  const payload = {
    sessionId: `SESS-${Date.now()}`,
    patientId: patientForm.patientId,
    date: new Date().toISOString(),
    gameMode: gameMode.value,
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
    rawLogs: sessionLogs.value
  };

  try {
    await axios.post(`${API_URL}/api/patients`, patientForm);
    const res = await axios.post(`${API_URL}/api/sessions`, payload);
    
    if (res.data.session.alertTriggered) {
      alert(`⚠️ มีการส่งแจ้งเตือนทางคลินิก:\nตรวจพบแนวโน้มที่คุณภาพการเคลื่อนไหวของมือข้างที่อ่อนแรง (${patientForm.affectedSide === 'left' ? 'ซีกซ้าย' : 'ซีกขวา'}) ของผู้ป่วยลดลงอย่างต่อเนื่อง ระบบได้ส่งอีเมลแจ้งเตือนไปยังนักกายภาพบำบัดที่ ${patientForm.therapistEmail} เรียบร้อยแล้ว`);
    }

    emit('session-saved', res.data.session);
    gameState.value = 'setup';
  } catch (error) {
    console.error('Failed to submit session data:', error);
    alert('การประเมินเสร็จสิ้น แต่ไม่สามารถบันทึกข้อมูลเข้าสู่เซิร์ฟเวอร์ได้ กำลังแสดงผลลัพธ์ในเครื่อง');
    
    emit('session-saved', {
      sessionId: payload.sessionId,
      patientId: payload.patientId,
      date: payload.date,
      metrics: payload.metrics,
      calculatedMetrics: analysis.detailedMetrics
    });
    gameState.value = 'setup';
  }
};

onMounted(() => {
  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkOrientation);
  window.removeEventListener('orientationchange', checkOrientation);
  stopAllTimers();
  stopCameraStream();
  if (handsInstance) {
    try {
      handsInstance.close();
    } catch (e) {}
  }
  if (poseInstance) {
    try {
      poseInstance.close();
    } catch (e) {}
  }
});
</script>

<style scoped>
.rit-game-container {
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  gap: 20px;
  width: 100%;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 16px;
}

.header-info h2 {
  margin: 0;
  font-size: 1.8rem;
  background: linear-gradient(135deg, #2dd4bf 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 0.9rem;
  color: hsl(var(--text-muted));
}

.game-timer {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  gap: 8px;
}

.timer-value {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  color: hsl(var(--accent-teal));
}

.timer-low .timer-value {
  color: hsl(var(--accent-rose));
  animation: pulse 1s infinite alternate;
}

/* Setup Screen styling */
.setup-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.instructions-card {
  padding: 32px;
  max-width: 550px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 500;
  color: hsl(var(--text-muted));
}

.patient-input-row {
  display: flex;
  gap: 12px;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-label {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  user-select: none;
}

.radio-label input {
  display: none;
}

.radio-label.active {
  background: rgba(13, 148, 136, 0.15);
  border-color: hsl(var(--accent-teal));
  color: #fff;
}

/* Arena Layout */
.arena-wrapper {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
}

@media (max-width: 1100px) {
  .arena-wrapper {
    grid-template-columns: 1fr;
  }
}

.canvas-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 800 / 500;
  height: auto;
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
}


.hidden-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 640px;
  height: 480px;
  opacity: 0.01;
  pointer-events: none;
  z-index: -1;
}

/* Overlays on Canvas */
.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(8px);
  z-index: 10;
  text-align: center;
  padding: 24px;
  box-sizing: border-box;
}

.canvas-overlay h3 {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.canvas-overlay p {
  color: hsl(var(--text-muted));
  max-width: 450px;
  margin: 6px 0;
}

.highlight {
  color: #34d399 !important;
  font-weight: 600;
  margin-top: 16px !important;
}

.countdown-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
}

.countdown-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 92px;
  height: 92px;
  border: 2px solid rgba(52, 211, 153, 0.75);
  border-radius: 50%;
  color: #34d399;
  font-family: 'Outfit', sans-serif;
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 0 24px rgba(52, 211, 153, 0.25);
}

.warning {
  color: #fb7185 !important;
  font-weight: 600;
  margin-top: 16px !important;
}

.calibration-overlay {
  background: linear-gradient(180deg, rgba(11, 15, 25, 0.42) 0%, rgba(11, 15, 25, 0.12) 48%, rgba(11, 15, 25, 0.02) 100%);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  justify-content: flex-start;
  padding-top: 40px;
}

.calibration-overlay h3,
.calibration-overlay p,
.calibration-overlay .countdown-panel {
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
}

/* Telemetry Sidebar */
.telemetry-sidebar {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.telemetry-sidebar h4 {
  margin: 0 0 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
  font-size: 1.1rem;
}

.telemetry-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.telemetry-stat .label {
  font-size: 0.8rem;
  color: hsl(var(--text-muted));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.telemetry-stat .value {
  font-weight: 600;
  font-size: 1rem;
}

.accent {
  color: hsl(var(--accent-violet));
}

.accent-rule {
  color: #c084fc;
  font-weight: 700;
}

.accent-teal {
  color: hsl(var(--accent-teal));
}

.highlight-state {
  color: hsl(var(--accent-teal));
  font-family: monospace;
}

.text-success {
  color: #34d399;
}

.text-danger {
  color: #fb7185;
}

.progress-bar-container {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: auto;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, hsl(var(--accent-teal)), hsl(var(--accent-violet)));
  transition: width 1s linear;
}

.abort-btn {
  margin-top: 12px;
  border-color: rgba(239, 68, 68, 0.2);
}

.abort-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
}



/* Animations */
@keyframes floatRobot {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes blinkEyes {
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
}

@keyframes talkMouth {
  0%, 100% {
    transform: scaleX(1) scaleY(1);
  }
  50% {
    transform: scaleX(1.3) scaleY(0.6);
  }
}

@keyframes glowDot {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes pulseAvatar {
  0% {
    transform: scale(0.95);
    opacity: 0.4;
  }
  70% {
    transform: scale(1.2);
    opacity: 0;
  }
  100% {
    transform: scale(0.95);
    opacity: 0;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Orientation Blocker overlay */
.orientation-blocker {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #0f172a;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 24px;
  box-sizing: border-box;
  color: #fff;
}

.blocker-content {
  max-width: 400px;
}

.rotate-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  animation: rotateAnim 2s infinite linear;
}

@keyframes rotateAnim {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(90deg); }
  100% { transform: rotate(90deg); }
}

@keyframes heartBeat {
  from { transform: scale(1); }
  to { transform: scale(1.2); }
}
</style>
