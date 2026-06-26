# 🤖 NeuroDex AI
> **Markerless Kinematic Telemetry Platform for Gamified Stroke Rehabilitation & Learned Non-Use Detection**
> *(ระบบวิเคราะห์การเคลื่อนไหวผ่านเว็บแคมเพื่อฟื้นฟูผู้ป่วยสโตรกและประเมินพฤติกรรมการละเลยร่างกายซีกอ่อนแรง)*

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://neuro-brown.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/Repository-GitHub-181717?style=flat-square&logo=github)](https://github.com/Devnoi/NeuroDexAI)
[![Tech Stack](https://img.shields.io/badge/Stack-Vue%203%20%7C%20Node%20%7C%20MongoDB-blue?style=flat-square)](#)

---

## 🇹🇭 คู่มือการใช้งานและเอกสารนวัตกรรม (ภาษาไทย)

### 📌 บทนำและปัญหาที่แก้ไข (Pain Point)
ผู้ป่วยโรคหลอดเลือดสมอง (Stroke) ที่มีอาการอัมพฤกษ์ครึ่งซีก (Hemiparesis) มักประสบปัญหา **"Learned Non-Use"** หรือการที่สมองสั่งการให้เลี่ยงไปใช้มือและแขนข้างปกติแทนข้างที่อ่อนแรง แม้ว่าอวัยวะข้างนั้นจะยังมีสมรรถภาพทางกายภาพหลงเหลืออยู่ หากปล่อยทิ้งไว้โดยไม่มีการวิเคราะห์และกระตุ้นการเคลื่อนไหวอย่างสม่ำเสมอ เส้นประสาทและกล้ามเนื้อฝั่งนั้นจะลีบตัวอย่างถาวร

**NeuroDex AI** เข้ามาแก้ไขปัญหานี้โดยการเปลี่ยนการประเมินแบบดั้งเดิมที่ต้องสวมใส่อุปกรณ์ราคาแพงและเดินทางไปโรงพยาบาล ให้เป็นแพลตฟอร์มฟื้นฟูผ่านเว็บเบราว์เซอร์ในรูปแบบเกมที่เข้าถึงได้ฟรีจากที่บ้าน โดยเก็บข้อมูลค่าวัดจลนศาสตร์การเคลื่อนไหวแบบไร้สัมผัส (Markerless Telemetry) และส่งแจ้งเตือนไปยังแพทย์เมื่อตรวจพบแนวโน้มประสิทธิภาพที่ลดลง

---

### ⚙️ คุณสมบัติหลักและโหมดการฟื้นฟู (Key Features & Rehab Modes)

1. **Markerless Hand & Body Tracking (AI-Powered)**
   * ตรวจจับและวิเคราะห์ตำแหน่งข้อมือ ปลายนิ้วชี้ และแกนข้อต่อร่างกายแบบ Real-time ความถี่ 30Hz ผ่านกล้องเว็บแคมแล็ปท็อปทั่วไป โดยใช้โมเดล **MediaPipe Hands & Pose**
2. **5 โหมดการประเมินและการเล่นเกมฟื้นฟู (5 Rehabilitation Game Modes)**
   * **Random Target (สุ่มเป้าหมายอิสระ):** ทดสอบและวัดสัดส่วนการเลือกใช้มือข้างอ่อนแรงอย่างสมัครใจ (Limb Selection Ratio) เพื่อคัดกรอง Learned Non-Use
   * **Forced Target (บังคับใช้ทีละซีก):** บังคับใช้มือข้างที่กำหนดสลับกัน เพื่อประเมินความเร็ว ความแม่นยำ และคุณภาพการเคลื่อนไหวในการสั่งการกล้ามเนื้อ
   * **Bilateral Coordination (สองมือประสานงาน):** ปล่อยเป้าหมายคู่ขนานที่ผู้ป่วยต้องเอื้อมสัมผัสพร้อมกันด้วยสองมือ เพื่อฝึกความสมดุลและการทำงานร่วมกันของทั้งสองซีกร่างกาย
   * **Range of Motion (ขอบเขตการเคลื่อนไหวข้อต่อ):** ตรวจจับและแสดงองศาการเหยียดกางของข้อต่อไหล่ (Shoulder Angle) สดๆ บนจอภาพเพื่อประเมินความติดเกร็งและขอบเขตข้อไหล่
   * **Cognitive Match (การจับคู่และการตัดสินใจ):** ฝึกสมองและการประมวลผลความจำส่วนสั่งการ (Response Inhibition) โดยกฎการชนเป้าหมายจะเปลี่ยนสีและรูปทรงทุกๆ 8 วินาที
3. **Clinical Kinematics Engine (ระบบประมวลผลเชิงการแพทย์)**
   * วิเคราะห์ค่าวัดเชิงลึก (Clinical Metrics) ของมือแต่ละข้าง เช่น Reaction Time, Movement Time, Resting Jitter, Movement Smoothness, และวัดระดับ Omission/Commission Error สำหรับคิดคะแนน Cognitive Score
4. **Privacy-First Design & Safe Recording**
   * ระบบติดตั้งหน้ากากปิดตาอัจฉริยะ (Privacy Eye Mask) คาดแถบดำบริเวณดวงตาระหว่างการทดสอบโดยอัตโนมัติ เพื่อปกป้องข้อมูลอัตลักษณ์บุคคลตามกฎหมาย PDPA/HIPAA
   * รองรับการดาวน์โหลดไฟล์บันทึกการประเมินสำหรับแพทย์ย้อนหลังในรูปแบบไฟล์ **`.mp4`** เท่านั้น
5. **Therapist Alert System & Trend Analysis**
   * คัดกรองและประเมินระดับความเสี่ยงของอาการ Learned Non-Use
   * แจ้งเตือนผ่านอีเมลไปยังนักกายภาพบำบัดโดยอัตโนมัติหากระบบพบแนวโน้มประสิทธิภาพการเคลื่อนไหวของมือซีกอ่อนแรงหรือสัดส่วนการใช้มือลดลงติดต่อกัน 3 ครั้ง

---

### 📊 สูตรและการคำนวณค่าวัดทางคลินิก (Clinical Metrics)

| ตัวชี้วัด (Metrics) | วิธีการวัดและการคำนวณ | ความสำคัญทางการแพทย์ |
| :--- | :--- | :--- |
| **Reaction Time (RT)** | ระยะเวลา ($ms$) ตั้งแต่เป้าหมายเริ่มปล่อยออกมา จนกระทั่งมือเริ่มเคลื่อนพ้นจากโซนพัก (การขยับ > 15px) | ประเมินความเร็วในการสั่งการของระบบประสาทและสมองส่วนสั่งการ |
| **Movement Time (MT)** | ระยะเวลา ($ms$) ตั้งแต่ปลายนิ้วเริ่มเคลื่อนพ้นโซนพักจนกระทั่งเข้าสกัดเป้าหมายได้สำเร็จ | ประเมินความแข็งแรงและความเร็วของกล้ามเนื้อในการเอื้อม |
| **Endpoint Accuracy** | ระยะขจัดแบบยูคลิด (Euclidean Distance) ระหว่างตำแหน่งปลายนิ้วชี้และจุดกึ่งกลางเป้าหมาย ณ เสี้ยววินาทีที่เข้าชน | ประเมินความสามารถในการควบคุมกล้ามเนื้อและประสาทตา (Hand-Eye Coordination) |
| **Resting Jitter** | ค่าเบี่ยงเบนมาตรฐาน (SD) ของพิกัด Y ของปลายนิ้วในขณะที่วางมืออยู่ในโซนพัก | ตรวจสอบอาการสั่นของมือ (Tremor Tracking) เช่น ในผู้ป่วยโรคพาร์กินสันหรือเกร็ง |
| **Movement Smoothness** | อัตราส่วนระหว่างความยาวแนววิถีการเคลื่อนที่จริง หารด้วยระยะทางเส้นตรงที่สั้นที่สุดจากจุดเริ่มไปยังเป้าหมาย | ตรวจจับอาการลังเล เก้งๆ กังๆ หรือวิถีเป๋ (ค่าสูงแปลว่าการสั่งการขยับกล้ามเนื้อสะดุด ไม่ราบเรียบ) |
| **Limb Selection Ratio** | สัดส่วนการเลือกใช้มือข้างอ่อนแรงในการขยับสกัดเป้าหมายที่ปรากฏขึ้นมาแบบสุ่มในกึ่งกลางจอภาพ | บ่งชี้พฤติกรรมความเสี่ยง **Learned Non-Use** หากมือข้างอ่อนแรงมีความสามารถทางฟิสิกส์ดี แต่ผู้ป่วยเลือกเลี่ยงไปใช้มือข้างปกติแทน |
| **Shoulder Joint Angle** | คำนวณมุมองศาระหว่างข้อไหล่และข้อมือจากพิกัดโครงกระดูกร่างกายของ MediaPipe Pose | ประเมินขอบเขตพิสัยการกางเหยียดข้อไหล่ ป้องกันภาวะข้อติดไหล่ยึด (Shoulder Range of Motion) |
| **Cognitive Score** | คะแนนเริ่มต้นที่ 100 หักลบจากข้อผิดพลาด Commission (-15 คะแนน) และ Omission (-5 คะแนน) | ประเมินสติสัมชัญญะ สมาธิ และการยับยั้งชั่งใจต่อการกระตุ้น (Response Inhibition) |


---

## 🇺🇸 English User Manual & Technical Documentation

### ⚙️ Key Features & Rehabilitation Modes

1. **Markerless Hand & Body Tracking (AI-Powered)**
   * Detects and analyzes the coordinates of wrists, index fingertips, and skeletal joint angles at 30Hz using **MediaPipe Hands & Pose** through standard webcams.
2. **5 Rehabilitation Game Modes**
   * **Random Target Mode:** Evaluates voluntary hand choice (*Limb Selection Ratio*) when targets appear in neutral zones, screening for *Learned Non-Use*.
   * **Forced Target Mode:** Commands the patient to use a specific hand, measuring unilateral speed, accuracy, and motor quality.
   * **Bilateral Coordination Mode:** Spawns parallel target configurations requiring simultaneous bilateral reaches to train coordinated arm movements.
   * **Range of Motion (ROM) Mode:** Calculates and renders shoulder joint angles in real-time to assess stiffness and range of motion.
   * **Cognitive Match Mode:** Tests attention, working memory, and response inhibition by swapping target-matching rules (colors/shapes) every 8 seconds.
3. **Clinical Kinematics Engine**
   * Computes clinical metrics: Reaction Time, Movement Time, Jitter, Path Smoothness, and registers commission/omission errors to produce a Cognitive Score.
4. **Privacy-First Design & Safe Recording**
   * Employs local Client-side face mapping to draw an automatic **Privacy Eye Mask** overlay over the patient's eyes in the recorded video.
   * Restricts exports exclusively to secured `.mp4` formats.
5. **Therapist Alert System & Trend Analysis**
   * Triggers automated email alerts to therapists if the patient's performance or selection ratio of the affected hand drops consecutively for 3 sessions.

---

### 📊 Clinical Metrics & Calculations

| Metric | Measurement & Formula | Clinical Significance |
| :--- | :--- | :--- |
| **Reaction Time (RT)** | Elapsed time ($ms$) from target spawn to hand movement onset (>15px deviation from rest zone). | Assesses motor planning speed and neural command latency. |
| **Movement Time (MT)** | Elapsed time ($ms$) from movement onset to target intersection. | Evaluates muscular speed, strength, and reach duration. |
| **Endpoint Accuracy** | Euclidean distance between index fingertip and target center at the moment of collision. | Measures eye-hand coordination and motor control precision. |
| **Resting Jitter** | Y-axis standard deviation (SD) of fingertip coordinates while resting in the home zone. | Detects tremors or spastic shaking (e.g., in Parkinson's/stroke). |
| **Movement Smoothness** | Ratio of actual trajectory path length to the shortest straight-line distance. | Identifies trajectory hesitation or deviations (closer to 1.0 is smoother). |
| **Limb Selection Ratio** | Percentage of affected hand selection during neutral, random target trials. | Identifies *Learned Non-Use* behavior (low selection ratio despite high capacity). |
| **Shoulder Joint Angle** | Calculated angle between shoulder coordinates and arm skeletal vectors. | Measures range of motion to detect joint contracture and stiffness. |
| **Cognitive Score** | 100 points baseline, penalized by Commission (-15 pts) and Omission (-5 pts) errors. | Gauges concentration, rule-following, and response inhibition. |

---

### 🚀 Getting Started (วิธีการติดตั้งและรันใช้งาน)


#### Prerequisites (สิ่งที่ต้องมีในเครื่อง)
* **Node.js** (v18 or higher)
* **MongoDB** (running locally or a Cloud Database URI)

#### 1. Setup Backend (หลังบ้าน)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run backend development server (Port 5001)
npm start
```

#### 2. Setup Frontend (หน้าบ้าน)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run frontend development server (Port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application locally.

---

### 🌐 Environment Variables Configuration

To deploy on cloud networks like Vercel and Render, customize API endpoints:

* **Frontend environment variable (`frontend/.env`)**:
  * `VITE_API_URL`: The deployed URL of your Express API backend. If left blank, it defaults to `http://localhost:5001` (local development).

* **Backend environment variables (`backend/.env`)**:
  * `PORT`: Port of Express server (default `5001`).
  * `MONGODB_URI`: MongoDB connection string.
  * `USE_MEMORY_DB`: Set to `true` to bypass MongoDB and run in-memory database mode (useful for sandbox and serverless runs).
