<template>
  <div class="app-layout">
    <!-- Navbar / Header -->
    <header class="navbar glass-panel">
      <div class="brand">
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
      </nav>
    </header>

    <!-- Main Content Area -->
    <main class="main-content">
      <div v-show="currentTab === 'game'">
        <RITGame @session-saved="handleSessionSaved" />
      </div>
      <div v-show="currentTab === 'dashboard'">
        <Dashboard ref="dashboardRef" />
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

const currentTab = ref('game');
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
</style>
