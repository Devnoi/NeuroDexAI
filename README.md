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

### ⚙️ คุณสมบัติหลักของระบบ (Key Features)

1. **Markerless Hand & Body Tracking (AI-Powered)**
   * ตรวจจับและวิเคราะห์ตำแหน่งข้อมือ ปลายนิ้วชี้ และแกนข้อต่อกระดูกร่างกายแบบ Real-time ความถี่ 30Hz ผ่านกล้องเว็บแคมแล็ปท็อปทั่วไป โดยใช้โมเดลโครงข่ายประสาท **MediaPipe Hands & Pose**
2. **Clinical Kinematics Engine (ระบบประมวลผลเชิงการแพทย์)**
   * วิเคราะห์ค่าวัดเชิงลึก (Clinical Metrics) ของมือแต่ละข้าง เช่น เวลาตอบสนอง (Reaction Time), เวลาเคลื่อนไหว (Movement Time), ความสั่นไหวขณะพัก (Resting Jitter), และความสม่ำเสมอราบเรียบของแนวแรง (Movement Smoothness)
3. **Privacy-First Design & Safe Recording**
   * ระบบติดตั้งหน้ากากปิดตาอัจฉริยะ (Privacy Eye Mask) คาดแถบดำบริเวณดวงตาระหว่างการทดสอบโดยอัตโนมัติ เพื่อปกป้องข้อมูลอัตลักษณ์บุคคลตามกฎหมาย PDPA/HIPAA
   * รองรับการดาวน์โหลดไฟล์บันทึกการประเมินสำหรับแพทย์ย้อนหลังในรูปแบบไฟล์ **`.mp4`** เท่านั้น
4. **Therapist Alert System & Trend Analysis**
   * คัดกรองและประเมินระดับความเสี่ยงของอาการ Learned Non-Use
   * แจ้งเตือนผ่านอีเมลไปยังนักกายภาพบำบัดโดยอัตโนมัติหากระบบพบแนวโน้มประสิทธิภาพการเคลื่อนไหวของมือซีกอ่อนแรงลดลงติดต่อกัน 3 ครั้ง

---

### 📊 สูตรและการคำนวณค่าวัดทางคลินิก (Clinical Metrics)

| ตัวชี้วัด (Metrics) | วิธีการวัดและการคำนวณ | ความสำคัญทางการแพทย์ |
| :--- | :--- | :--- |
| **Reaction Time (RT)** | ระยะเวลา ($ms$) ตั้งแต่เป้าหมายเริ่มปล่อยออกมา จนกระทั่งมือเริ่มเคลื่อนพ้นจากโซนพัก (การขยับ > 15px) | ประเมินความเร็วในการสั่งการของระบบประสาทและสมองส่วนสั่งการ |
| **Movement Time (MT)** | ระยะเวลา ($ms$) ตั้งแต่ปลายนิ้วเริ่มเคลื่อนพ้นโซนพักจนกระทั่งเข้าสกัดเป้าหมายได้สำเร็จ | ประเมินความแข็งแรงและความเร็วของกล้ามเนื้อในการเอื้อม |
| **Endpoint Accuracy** | ระยะขจัดแบบยูคลิด (Euclidean Distance) ระหว่างตำแหน่งปลายนิ้วชี้และจุดกึ่งกลางเป้าหมาย ณ เสี้ยววินาทีที่เข้าชน | ประเมินความสามารถในการควบคุมกล้ามเนื้อและประสาทตา (Hand-Eye Coordination) |
| **Resting Jitter** | ค่าเบี่ยงเบนมาตรฐาน (SD) ของพิกัดแนวแกน Y ของปลายนิ้วในขณะที่วางมืออยู่ในโซนพัก | ตรวจสอบอาการสั่นของมือ (Tremor Tracking) เช่น ในผู้ป่วยโรคพาร์กินสันหรือเกร็ง |
| **Movement Smoothness** | อัตราส่วนระหว่างความยาวแนววิถีการเคลื่อนที่จริง หารด้วยระยะทางเส้นตรงที่สั้นที่สุดจากจุดเริ่มไปยังเป้าหมาย | ตรวจจับอาการลังเล เก้งๆ กังๆ หรือวิถีเป๋ (ค่าสูงแปลว่าการสั่งการขยับกล้ามเนื้อสะดุด ไม่ราบเรียบ) |
| **Limb Selection Ratio** | สัดส่วนการเลือกใช้มือข้างอ่อนแรงในการขยับสกัดเป้าหมายที่ปรากฏขึ้นมาแบบสุ่มในกึ่งกลางจอภาพ | บ่งชี้พฤติกรรมความเสี่ยง **Learned Non-Use** หากมือข้างอ่อนแรงมีความสามารถทางฟิสิกส์ดี แต่ผู้ป่วยเลือกเลี่ยงไปใช้มือข้างปกติแทน |

---

## 🇺🇸 English User Manual & Technical Documentation

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
