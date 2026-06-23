# Reaction Interception Task (RIT) Web-Based Medical Application

This MVP assesses hand dexterity and "Learned Non-Use" in hemiparetic patients using computer vision telemetry.

## System Architecture

1.  **Frontend (Port 3000)**: Vue 3 (Composition API), HTML5 Canvas game loop, MediaPipe Hands (CDN), and Chart.js dashboards.
2.  **Backend (Port 5001)**: Express REST API that handles session logging and applies the clinical metrics engine.
3.  **Database**: MongoDB (using Mongoose) for patient and kinematic telemetry storage.

---

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   MongoDB running locally (`mongodb://localhost:27017/rit_db` by default)

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Medical Assessment Metrics Calculated

*   **Reaction Time (RT)**: Time in $ms$ between target spawn and hand leaving the resting zone (>15px movement).
*   **Movement Time (MT)**: Time in $ms$ between hand leaving resting zone and intercepting the target.
*   **Success Rate**: Percentage of successfully intercepted targets.
*   **Endpoint Accuracy**: Euclidean pixel error between the finger tip and target center at the moment of intersection.
*   **Resting Jitter**: Standard deviation of Y coordinates while finger is inside the resting zone (tremor tracking).
*   **Movement Smoothness**: Trajectory path length divided by straight-line distance (higher value indicates hesitations/wandering paths associated with Learned Non-Use).
