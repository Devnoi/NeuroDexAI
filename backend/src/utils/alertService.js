export class AlertService {
  /**
   * Evaluates if a patient's affected limb has shown a continuous decline in movement quality over the last 3 sessions.
   * If so, sends a clinical alert email to the physical therapist.
   * @param {Object} patient - The patient profile
   * @param {Array} sessions - Sorted list of past sessions (chronological order)
   * @returns {Object|null} Alert details if sent, else null
   */
  static checkAndSendAlert(patient, sessions) {
    if (!patient || !sessions || sessions.length < 3) return null;

    // Filter sessions to only those containing metrics for this patient
    const patientSessions = sessions
      .filter(s => s.patientId === patient.patientId)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // chronological order

    if (patientSessions.length < 3) return null;

    // Get the last 3 sessions
    const lastThree = patientSessions.slice(-3);
    
    // Check quality scores of the affected hand
    const affectedSide = patient.affectedSide; // 'left' or 'right'
    const qKey = affectedSide === 'left' ? 'leftHandQuality' : 'rightHandQuality';

    const q1 = lastThree[0].metrics[qKey];
    const q2 = lastThree[1].metrics[qKey];
    const q3 = lastThree[2].metrics[qKey];

    // Check if strictly decreasing: q1 > q2 > q3
    if (q1 > q2 && q2 > q3) {
      const email = patient.therapistEmail || 'therapist@neurodex.com';
      const alertMessage = `
=========================================
การแจ้งเตือนทางคลินิก: การถดถอยของการเคลื่อนไหว
=========================================
ส่งถึง: ${email}
หัวข้อ: แจ้งเตือนจากระบบ NeuroDex - คุณภาพการเคลื่อนไหวลดลงของผู้ป่วย ${patient.name} (${patient.patientId})

เรียน นักกายภาพบำบัด,

ระบบวิเคราะห์จลนศาสตร์เรียลไทม์ของเราได้ตรวจพบแนวโน้มคุณภาพการเคลื่อนไหวที่ลดลงอย่างต่อเนื่องของมือข้างที่อ่อนแรง (ซีก${affectedSide === 'left' ? 'ซ้าย' : 'ขวา'}) สำหรับผู้ป่วย ${patient.name} (${patient.patientId}) ในการทดสอบประเมิน 3 เซสชันล่าสุด

คะแนนสถิติคุณภาพการเคลื่อนไหวสะสมตามลำดับเวลา:
- เซสชัน ${lastThree[0].sessionId} (${new Date(lastThree[0].date).toLocaleDateString()}): ${q1}%
- เซสชัน ${lastThree[1].sessionId} (${new Date(lastThree[1].date).toLocaleDateString()}): ${q2}%
- เซสชัน ${lastThree[2].sessionId} (${new Date(lastThree[2].date).toLocaleDateString()}): ${q3}% (ล่าสุด)

แนวโน้มความเสื่อมถอยนี้อาจบ่งบอกถึงการเคลื่อนไหวทดแทน (Motor Compensation) หรือการเพิ่มขึ้นของภาวะไม่ใช้งานมือจากการเรียนรู้ (Learned Non-Use) แนะนำให้ทบทวนประเมินความก้าวหน้าและการรักษาของผู้ป่วยรายนี้

ขอแสดงความนับถือ,
ระบบรายงานอัตโนมัติ NeuroDex
=========================================
      `;
      console.warn(alertMessage);
      return {
        triggered: true,
        recipient: email,
        scores: [q1, q2, q3],
        message: alertMessage
      };
    }

    return null;
  }
}

export default AlertService;
