<template>
  <div class="app-layout">
    <!-- Navbar / Header (Only show if not in welcome tab) -->
    <header v-if="currentTab !== 'welcome'" class="navbar glass-panel">
      <div class="brand" @click="currentTab = 'welcome'" style="cursor: pointer;">
        <svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span class="brand-title">NeuroDex RIT</span>
      </div>
      <nav class="nav-tabs">
        <button 
          class="nav-tab-btn" 
          :class="{ active: currentTab === 'game' }"
          @click="currentTab = 'game'"
        >
          การทดสอบและประเมินผล
        </button>
        <button 
          class="nav-tab-btn" 
          :class="{ active: currentTab === 'dashboard' }"
          @click="currentTab = 'dashboard'"
        >
          แดชบอร์ดข้อมูลทางคลินิก
        </button>
        <button 
          class="nav-tab-btn" 
          :class="{ active: currentTab === 'telemed' }"
          @click="currentTab = 'telemed'"
        >
          แพทย์ทางไกล & ปรึกษาแบบเรียลไทม์ (Telehealth)
        </button>
      </nav>
    </header>

    <!-- Welcome / Entry Page -->
    <div v-if="currentTab === 'welcome'" class="welcome-screen-container">
      <div class="welcome-card glass-panel">
        <div class="welcome-badge">🏆 HealthTech Innovation 2026</div>
        <h1 class="welcome-title">NeuroDex <span class="accent-text">AI</span></h1>
        <p class="welcome-subtitle">
          แพลตฟอร์มฟื้นฟูทางไกลและวิเคราะห์จลนศาสตร์การสั่งการประสาทของมือแบบไร้สัมผัส (Markerless Tele-rehabilitation)
        </p>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>ระบบสแกนสรีระและนิ้วมือ</h3>
            <p>วิเคราะห์พิกัดการขยับมือ ข้อมือ และท่าทางแบบเรียลไทม์ 30Hz ผ่านเว็บแคมทั่วไป ไม่จำเป็นต้องใช้อุปกรณ์สวมใส่ราคาแพง</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>รักษาความเป็นส่วนตัวสูงสุด</h3>
            <p>กลไกปิดบังดวงตา (Privacy Masking) อัตโนมัติบนกล้อง และเข้ารหัสบันทึกวิดีโอเป็นไฟล์ MP4 เท่านั้นเพื่อความปลอดภัยข้อมูล</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>วิเคราะห์ภาวะ Learned Non-Use</h3>
            <p>ประเมินและคัดกรองพฤติกรรมการละเลยไม่ยอมขยับอวัยวะข้างที่อ่อนแรงแบบ Clinical-Grade พร้อมระบบรายงานนักกายภาพอัตโนมัติ</p>
          </div>
        </div>

        <button class="btn-start-assessment" @click="currentTab = 'game'">
          เริ่มต้นการประเมินผู้ป่วย
          <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <main v-else class="main-content">
      <div v-show="currentTab === 'game'">
        <RITGame @session-saved="handleSessionSaved" />
      </div>
      <div v-show="currentTab === 'dashboard'">
        <Dashboard ref="dashboardRef" />
      </div>
      <div v-show="currentTab === 'telemed'">
        <Telehealth />
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p>&copy; 2026 NeuroDex Systems. พัฒนาขึ้นสำหรับการวิเคราะห์และรายงานผลจลนศาสตร์ทางการแพทย์</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import RITGame from './components/RITGame.vue';
import Dashboard from './components/Dashboard.vue';
import Telehealth from './components/Telehealth.vue';

const currentTab = ref('welcome');
const dashboardRef = ref(null);

const handleSessionSaved = (savedSession) => {
  // Move to dashboard tab to view results
  currentTab.value = 'dashboard';
  // Trigger a refresh on the dashboard component
  if (dashboardRef.value) {
    dashboardRef.value.refresh();
  }
};
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 40px;
  margin: 16px 20px;
  border-radius: var(--border-radius-sm);
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 24px;
  height: 24px;
  color: #2dd4bf;
}

.brand-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.3rem;
  letter-spacing: -0.02em;
}

.nav-tabs {
  display: flex;
  gap: 8px;
}

.nav-tab-btn {
  background: transparent;
  border: none;
  color: hsl(var(--text-muted));
  padding: 8px 18px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
}

.nav-tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.04);
}

.nav-tab-btn.active {
  color: #fff;
  background: rgba(13, 148, 136, 0.15);
  border: 1px solid rgba(13, 148, 136, 0.3);
}

.main-content {
  flex: 1;
  padding: 0 20px 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer {
  text-align: center;
  padding: 20px;
  font-size: 0.8rem;
  color: hsl(var(--text-muted));
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: auto;
}

/* Welcome Screen Styling */
.welcome-screen-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 40px 20px;
  animation: fadeIn 0.6s ease-out;
  width: 100%;
}

.welcome-card {
  max-width: 900px;
  width: 100%;
  padding: 48px;
  border-radius: var(--border-radius-lg);
  text-align: center;
  background: rgba(15, 23, 42, 0.45) !important;
  border: 1px solid rgba(167, 139, 250, 0.2) !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(45, 212, 191, 0.1);
  border: 1px solid rgba(45, 212, 191, 0.3);
  color: #2dd4bf;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.welcome-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.03em;
}

.accent-text {
  background: linear-gradient(135deg, #a78bfa 0%, #2dd4bf 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: 40px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  width: 100%;
  margin-bottom: 48px;
}

.feature-card {
  padding: 24px;
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius-md);
  text-align: left;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(167, 139, 250, 0.3);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  font-size: 2.2rem;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #f8fafc;
}

.feature-card p {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.btn-start-assessment {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 36px;
  background: linear-gradient(135deg, hsl(var(--accent-teal)), hsl(var(--accent-violet)));
  color: #fff;
  border: none;
  border-radius: var(--border-radius-sm);
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 30px rgba(45, 212, 191, 0.3);
}

.btn-start-assessment:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(45, 212, 191, 0.5);
  filter: brightness(1.1);
}

.arrow-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.btn-start-assessment:hover .arrow-icon {
  transform: translateX(4px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 12px;
    padding: 10px 20px;
    margin: 8px 10px;
  }
  
  .nav-tabs {
    width: 100%;
    justify-content: center;
  }

  .nav-tab-btn {
    flex: 1;
    text-align: center;
    padding: 8px 10px;
    font-size: 0.85rem;
  }

  .welcome-title {
    font-size: 2.4rem;
  }

  .welcome-card {
    padding: 24px;
  }

  .welcome-subtitle {
    font-size: 1rem;
    margin-bottom: 24px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }
  
  .main-content {
    padding: 0 10px 20px 10px;
  }
}
</style>
