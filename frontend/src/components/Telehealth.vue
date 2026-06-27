<template>
  <div class="telehealth-container glass-panel">
    <!-- Header Case Summary -->
    <div class="telehealth-header">
      <div class="header-left">
        <h2>ระบบแพทย์ทางไกลและการปรึกษาแบบเรียลไทม์ (Telehealth Console)</h2>
        <p class="subtitle">จำลองการโทรวิดีโอคอลและการส่งข้อความปรึกษาผู้เชี่ยวชาญแบบเรียลไทม์ พร้อมระบบส่งต่อข้อมูลจลนศาสตร์การสั่งการ</p>
      </div>
      <div class="patient-status-badge" :class="{ active: callActive }">
        <span class="status-dot"></span>
        {{ callActive ? 'ในการโทร (ON CALL)' : 'ออนไลน์ (STANDBY)' }}
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="telehealth-workspace">
      <!-- Left: Video Call Panel -->
      <div class="video-call-panel glass-panel">
        <div class="video-container">
          <!-- Remote Video Feed (Therapist) -->
          <div class="remote-video">
            <div class="video-overlay-info">
              <span class="user-badge">👨‍⚕️ กภ. วิชัย (นักกายภาพบำบัดเจ้าของไข้)</span>
              <span class="quality-badge">1080p | 60 FPS</span>
            </div>
            
            <!-- Simulated Video Content -->
            <div v-if="callActive" class="video-stream-simulated">
              <div class="therapist-avatar-container">
                <div class="wave-pulse purple"></div>
                <div class="wave-pulse teal"></div>
                <div class="therapist-avatar">🩺</div>
              </div>
              <div class="therapist-voice-indicator">
                <span class="bar" v-for="n in 6" :key="n" :style="{ height: `${Math.random() * 20 + 5}px` }"></span>
              </div>
              <p class="therapist-status-msg">แพทย์ผู้เชี่ยวชาญกำลังรับฟังและวิเคราะห์ข้อมูลจลนศาสตร์...</p>
            </div>
            <div v-else class="video-placeholder">
              <span class="placeholder-icon">📺</span>
              <p>พร้อมเชื่อมต่อสายกับนักเวชศาสตร์ฟื้นฟู</p>
              <button class="btn-start-call" @click="startCall">
                📞 เริ่มการสนทนาทางไกล (Tele-consultation)
              </button>
            </div>

            <!-- Clinical Metrics HUD Overlay -->
            <div v-if="callActive && showHud" class="metrics-hud glass-panel">
              <h4 class="hud-title">📊 Clinical Telemetry HUD</h4>
              <div class="hud-grid">
                <div class="hud-item">
                  <span class="hud-label">LNU Risk:</span>
                  <span class="hud-val text-amber">ปานกลาง (Medium)</span>
                </div>
                <div class="hud-item">
                  <span class="hud-label">Speed:</span>
                  <span class="hud-val">76%</span>
                </div>
                <div class="hud-item">
                  <span class="hud-label">Accuracy:</span>
                  <span class="hud-val">82%</span>
                </div>
                <div class="hud-item">
                  <span class="hud-label">Quality:</span>
                  <span class="hud-val">74%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Local Video Feed (Patient Webcam) -->
          <div v-if="callActive" class="local-video glass-panel">
            <div class="video-overlay-info small">
              <span class="user-badge-sm">👤 คุณสมศักดิ์ (ผู้ป่วย - ซีกอ่อนแรง: ขวา)</span>
            </div>
            <video ref="localVideoRef" autoplay playsinline muted class="webcam-feed"></video>
            <div v-if="!cameraOn" class="camera-off-overlay">
              <span>📷 กล้องปิดอยู่</span>
            </div>
          </div>
        </div>

        <!-- Call Control Bar -->
        <div v-if="callActive" class="call-controls">
          <button class="ctrl-btn" :class="{ active: !muted }" @click="muted = !muted" :title="muted ? 'เปิดไมค์' : 'ปิดไมค์'">
            <span class="ctrl-icon">{{ muted ? '🎙️' : '🎙️' }}</span>
            <span class="ctrl-label">{{ muted ? 'เปิดไมค์' : 'ปิดไมค์' }}</span>
          </button>
          <button class="ctrl-btn" :class="{ active: !cameraOn }" @click="toggleCamera" :title="cameraOn ? 'ปิดกล้อง' : 'เปิดกล้อง'">
            <span class="ctrl-icon">📷</span>
            <span class="ctrl-label">{{ cameraOn ? 'ปิดกล้อง' : 'เปิดกล้อง' }}</span>
          </button>
          <button class="ctrl-btn" :class="{ active: showHud }" @click="showHud = !showHud" title="แสดงผลสถิติจลนศาสตร์ทับหน้าจอ">
            <span class="ctrl-icon">📊</span>
            <span class="ctrl-label">แชร์ข้อมูลจลนศาสตร์</span>
          </button>
          <button class="ctrl-btn end-call" @click="endCall" title="วางสาย">
            <span class="ctrl-icon">🔴</span>
            <span class="ctrl-label">วางสาย</span>
          </button>
        </div>
      </div>

      <!-- Right: Real-time Consultation Chat Console -->
      <div class="chat-panel glass-panel">
        <div class="chat-header">
          <h3>💬 ช่องแชทปรึกษาผู้เชี่ยวชาญ</h3>
          <span class="chat-desc">ส่งคำถาม กายภาพบำบัด หรือรายงานความตึงเกร็ง</span>
        </div>

        <!-- Chat Message Log -->
        <div class="message-log" ref="messageLogRef">
          <div v-for="(msg, index) in messages" :key="index" class="chat-bubble-container" :class="msg.sender">
            <div class="sender-name">{{ msg.senderName }}</div>
            <div class="chat-bubble">
              <p class="bubble-text">{{ msg.message }}</p>
              <span class="bubble-time">{{ formatTime(msg.timestamp) }}</span>
            </div>
          </div>
          
          <!-- Typing Indicator -->
          <div v-if="typing" class="chat-bubble-container therapist typing">
            <div class="sender-name">กภ. วิชัย (กำลังพิมพ์...)</div>
            <div class="chat-bubble">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Composer Form -->
        <form @submit.prevent="sendMessage" class="message-composer">
          <input 
            type="text" 
            v-model="newMessageText" 
            placeholder="พิมพ์ข้อความคำถามเกี่ยวกับอาการเกร็ง ไหล่ติด หรือความก้าวหน้า..."
            class="form-input chat-input" 
            required
            :disabled="typing"
          />
          <button type="submit" class="btn-send" :disabled="typing || !newMessageText.trim()">
            ส่ง 🚀
          </button>
        </form>
      </div>
    </div>

    <!-- Doctor's Real-Time Kinematics Observation Console -->
    <div class="doctor-live-monitor glass-panel" style="margin-top: 20px; padding: 18px; border: 1.5px solid rgba(99, 102, 241, 0.45); background: rgba(15, 23, 42, 0.9);">
      <h3 style="color: #6366f1; margin: 0 0 10px 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
        📡 คอนโซลเฝ้าสังเกตการณ์จลนศาสตร์เรียลไทม์สำหรับแพทย์ (Doctor's Live Session Monitor)
      </h3>
      
      <div v-if="liveTelemetry" class="live-monitor-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
        <!-- Heart Rate & Exertion Gauge -->
        <div class="monitor-card" style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
          <h4 style="margin: 0 0 6px 0; font-size: 0.9rem; color: #f43f5e; display: flex; align-items: center; justify-content: center; gap: 4px;">
            ❤️ Live Heart Rate
          </h4>
          <div style="font-size: 2.2rem; font-weight: bold; color: #ef4444; margin: 8px 0;">
            {{ liveTelemetry.currentHeartRate }} <span style="font-size: 1rem;">BPM</span>
          </div>
          <div style="font-size: 0.8rem; color: #94a3b8;">
            สถานะ: {{ liveTelemetry.currentHeartRate > 120 ? '🚨 หัวใจเต้นเร็ว/ล้า' : '🟢 ปลอดภัย' }}
          </div>
        </div>

        <!-- 3D Finger Z-Depth & Spasticity -->
        <div class="monitor-card" style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
          <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #2dd4bf; text-align: center;">
            📡 3D Depth & Spasticity
          </h4>
          <table style="width: 100%; font-size: 0.8rem; color: #cbd5e1; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="padding: 4px 0;"><strong>Left Hand:</strong></td>
                <td style="text-align: right;">Depth: {{ liveTelemetry.leftFingerZ.toFixed(3) }}m | เกร็ง: {{ liveTelemetry.leftHandSpasticity }}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Right Hand:</strong></td>
                <td style="text-align: right;">Depth: {{ liveTelemetry.rightFingerZ.toFixed(3) }}m | เกร็ง: {{ liveTelemetry.rightHandSpasticity }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Shoulder ROM & Compensation Alerts -->
        <div class="monitor-card" style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
          <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #38bdf8; text-align: center;">
            📐 Shoulder ROM & Posture
          </h4>
          <table style="width: 100%; font-size: 0.8rem; color: #cbd5e1; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="padding: 4px 0;"><strong>Left Active ROM:</strong></td>
                <td style="text-align: right;">{{ liveTelemetry.leftShoulderAngle !== null ? liveTelemetry.leftShoulderAngle + '°' : '--' }}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Right Active ROM:</strong></td>
                <td style="text-align: right;">{{ liveTelemetry.rightShoulderAngle !== null ? liveTelemetry.rightShoulderAngle + '°' : '--' }}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Postural Lean:</strong></td>
                <td style="text-align: right;" :style="{ color: liveTelemetry.isCompensating ? '#ef4444' : '#34d399', fontWeight: liveTelemetry.isCompensating ? 'bold' : 'normal' }">
                  {{ liveTelemetry.isCompensating ? '🚨 เอียงตัวชดเชย' : 'ปกติ' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div v-else style="text-align: center; color: #64748b; padding: 20px; font-size: 0.9rem; border: 1.5px dashed rgba(255,255,255,0.05); border-radius: 8px;">
        📡 ยังไม่มีการเปิดการทดสอบประเมิน หรือผู้ป่วยไม่ได้อยู่ในเซสชัน RIT (กำลังรอการส่งสัญญาณชีพและจลนศาสตร์ดิบ...)
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue';
import axios from 'axios';

const callActive = ref(false);
const showHud = ref(true);
const muted = ref(false);
const cameraOn = ref(true);
const typing = ref(false);
const newMessageText = ref('');
const messages = ref([]);
const localVideoRef = ref(null);
const messageLogRef = ref(null);
let mediaStream = null;

const liveTelemetry = ref(null);
let telemetryPollIntervalId = null;

const startCall = async () => {
  callActive.value = true;
  cameraOn.value = true;
  await nextTick();
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.value) {
      localVideoRef.value.srcObject = mediaStream;
    }
  } catch (err) {
    console.warn("Could not access camera/mic for telehealth call:", err);
    cameraOn.value = false;
  }
};

const endCall = () => {
  callActive.value = false;
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
};

const toggleCamera = () => {
  cameraOn.value = !cameraOn.value;
  if (mediaStream) {
    mediaStream.getVideoTracks().forEach(track => {
      track.enabled = cameraOn.value;
    });
  }
};

const loadMessages = async () => {
  try {
    const res = await axios.get('http://localhost:5001/api/telemed/messages/demo-patient');
    messages.value = res.data.messages;
    scrollToBottom();
  } catch (err) {
    console.error("Error loading telemed messages:", err);
  }
};

const sendMessage = async () => {
  if (!newMessageText.value.trim()) return;
  const userMsg = newMessageText.value;
  newMessageText.value = '';

  const tempUserMessage = {
    patientId: 'demo-patient',
    sender: 'patient',
    senderName: 'สมศักดิ์ รักไทย (ผู้ป่วย)',
    message: userMsg,
    timestamp: new Date().toISOString()
  };

  messages.value.push(tempUserMessage);
  scrollToBottom();

  try {
    typing.value = true;
    scrollToBottom();

    // Send to backend
    const res = await axios.post('http://localhost:5001/api/telemed/messages', {
      patientId: 'demo-patient',
      sender: 'patient',
      senderName: 'สมศักดิ์ รักไทย (ผู้ป่วย)',
      message: userMsg
    });

    // Simulate typing and response loading 1.5 seconds later
    setTimeout(() => {
      typing.value = false;
      if (res.data.simulatedReply) {
        messages.value.push(res.data.simulatedReply);
      }
      scrollToBottom();
    }, 1500);

  } catch (err) {
    console.error("Error sending message:", err);
    typing.value = false;
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messageLogRef.value) {
      messageLogRef.value.scrollTop = messageLogRef.value.scrollHeight;
    }
  });
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  loadMessages();
  telemetryPollIntervalId = setInterval(() => {
    if (window.__lastLiveTelemetry && (Date.now() - window.__lastLiveTelemetry.timestamp < 3000)) {
      liveTelemetry.value = window.__lastLiveTelemetry;
    } else {
      liveTelemetry.value = null;
    }
  }, 100);
});

onBeforeUnmount(() => {
  if (telemetryPollIntervalId) {
    clearInterval(telemetryPollIntervalId);
  }
  endCall();
});
</script>

<style scoped>
.telehealth-container {
  max-width: 1200px;
  width: 100%;
  padding: 30px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.telehealth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 16px;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 4px 0 0 0;
}

.patient-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
}

.patient-status-badge.active {
  color: #2dd4bf;
  background: rgba(45, 212, 191, 0.08);
  border-color: rgba(45, 212, 191, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #94a3b8;
  border-radius: 50%;
}

.patient-status-badge.active .status-dot {
  background-color: #2dd4bf;
  box-shadow: 0 0 8px #2dd4bf;
  animation: pulse 1s infinite alternate;
}

.telehealth-workspace {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  height: 520px;
}

@media (max-width: 900px) {
  .telehealth-workspace {
    grid-template-columns: 1fr;
    height: auto;
  }
}

/* Video Panel Styling */
.video-call-panel {
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.6) !important;
  border-color: rgba(45, 212, 191, 0.15) !important;
  overflow: hidden;
  position: relative;
  height: 100%;
}

.video-container {
  flex: 1;
  position: relative;
  background: #090d16;
}

.remote-video {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-stream-simulated {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%);
  gap: 16px;
}

.therapist-avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.therapist-avatar {
  font-size: 3.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(45, 212, 191, 0.4);
  border-radius: 50%;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 0 20px rgba(45, 212, 191, 0.2);
}

.wave-pulse {
  position: absolute;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  animation: ripple 2s infinite ease-out;
  opacity: 0;
}

.wave-pulse.purple {
  border: 1px solid #a78bfa;
  animation-delay: 0s;
}

.wave-pulse.teal {
  border: 1px solid #2dd4bf;
  animation-delay: 1s;
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.therapist-status-msg {
  font-size: 0.9rem;
  color: #94a3b8;
  text-align: center;
  max-width: 300px;
}

.therapist-voice-indicator {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 30px;
}

.therapist-voice-indicator .bar {
  width: 3px;
  background-color: #2dd4bf;
  border-radius: 2px;
  animation: jump 0.6s infinite alternate;
}

.therapist-voice-indicator .bar:nth-child(even) {
  background-color: #a78bfa;
  animation-delay: 0.2s;
}

@keyframes jump {
  0% { transform: scaleY(0.4); }
  100% { transform: scaleY(1.4); }
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}

.placeholder-icon {
  font-size: 4rem;
  opacity: 0.4;
}

.btn-start-call {
  background: linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: var(--border-radius-sm);
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(13, 148, 136, 0.3);
  transition: all 0.2s ease;
}

.btn-start-call:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
}

.video-overlay-info {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.video-overlay-info.small {
  top: 8px;
  left: 8px;
}

.user-badge {
  background: rgba(15, 23, 42, 0.7);
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.user-badge-sm {
  background: rgba(15, 23, 42, 0.8);
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  font-weight: 700;
}

.quality-badge {
  background: rgba(13, 148, 136, 0.2);
  border: 1px solid rgba(13, 148, 136, 0.3);
  color: #2dd4bf;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  font-weight: 700;
}

.local-video {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 140px;
  height: 105px;
  border-radius: var(--border-radius-sm);
  border: 1.5px solid rgba(45, 212, 191, 0.4) !important;
  overflow: hidden;
  background: #000;
  z-index: 5;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.webcam-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* Mirror camera */
}

.camera-off-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #94a3b8;
}

.metrics-hud {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 200px;
  background: rgba(15, 23, 42, 0.85) !important;
  border: 1px solid rgba(167, 139, 250, 0.3) !important;
  padding: 10px;
  z-index: 4;
}

.hud-title {
  margin: 0 0 6px 0;
  font-size: 0.8rem;
  color: #a78bfa;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 4px;
}

.hud-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hud-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
}

.hud-label {
  color: #94a3b8;
}

.hud-val {
  font-weight: 700;
  color: #fff;
}

.text-amber {
  color: #f59e0b;
}

/* Call Control Bar */
.call-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 10;
}

.ctrl-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 64px;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.ctrl-btn.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.ctrl-icon {
  font-size: 1.1rem;
}

.ctrl-label {
  font-size: 0.65rem;
  margin-top: 2px;
}

.end-call {
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
  color: #ef4444 !important;
}

.end-call:hover {
  background: #ef4444 !important;
  color: white !important;
}

/* Chat Panel Styling */
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(15, 23, 42, 0.45) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.chat-desc {
  font-size: 0.75rem;
  color: #94a3b8;
}

.message-log {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-bubble-container {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.chat-bubble-container.patient {
  align-self: flex-end;
  align-items: flex-end;
}

.chat-bubble-container.therapist {
  align-self: flex-start;
  align-items: flex-start;
}

.sender-name {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-bottom: 4px;
  padding: 0 4px;
}

.chat-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.patient .chat-bubble {
  background: #0d9488;
  color: white;
  border-bottom-right-radius: 4px;
}

.therapist .chat-bubble {
  background: rgba(167, 139, 250, 0.15);
  color: #d8e7ff;
  border: 1px solid rgba(167, 139, 250, 0.25);
  border-bottom-left-radius: 4px;
}

.bubble-text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
}

.bubble-time {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.5);
  align-self: flex-end;
  margin-top: 4px;
}

.therapist .bubble-time {
  color: rgba(216, 231, 255, 0.5);
}

/* Typing Indicator Animation */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 6px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background-color: #a78bfa;
  border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.1); opacity: 1; }
}

/* Composer Form */
.message-composer {
  display: flex;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;
  background: rgba(15, 23, 42, 0.2);
}

.chat-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  padding: 10px 14px;
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
}

.chat-input:focus {
  border-color: rgba(45, 212, 191, 0.5) !important;
}

.btn-send {
  background: linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%);
  border: none;
  color: white;
  padding: 0 20px;
  border-radius: var(--border-radius-sm);
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);
  transition: all 0.2s ease;
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(13, 148, 136, 0.3);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 4px #2dd4bf; }
  100% { transform: scale(1.1); box-shadow: 0 0 12px #2dd4bf; }
}
</style>
