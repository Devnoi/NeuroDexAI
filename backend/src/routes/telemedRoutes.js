import express from 'express';
import Consultation from '../models/Consultation.js';

const router = express.Router();

// In-memory messages store for memory DB mode
const memoryMessages = [
  {
    patientId: "demo-patient",
    sender: "therapist",
    senderName: "กภ. วิชัย (นักกายภาพบำบัด)",
    message: "สวัสดีครับคุณสมศักดิ์ วันนี้การฝึก ROM ทำได้ดีขึ้นมากเลยครับ แต่อย่าลืมระวังเรื่องไหล่ติดนะครับ",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    patientId: "demo-patient",
    sender: "patient",
    senderName: "สมศักดิ์ รักไทย (ผู้ป่วย)",
    message: "ขอบคุณครับหมอ ช่วงนี้รู้สึกยกแขนขวาได้สูงขึ้นนิดหน่อยแล้วครับ แต่ยังมีอาการล้าเวลาเล่นโหมด ROM อยู่บ้าง",
    timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString()
  },
  {
    patientId: "demo-patient",
    sender: "therapist",
    senderName: "กภ. วิชัย (นักกายภาพบำบัด)",
    message: "ดีมากครับคุณสมศักดิ์! ถ้าเกิดอาการล้า แนะนำให้ลดความเร็วในการเอื้อม หรือพักระหว่างเซสชัน 2-3 นาทีได้เลยนะครับ ไม่ต้องฝืน",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString()
  }
];

// Get telehealth message history for a patient
router.get('/messages/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (global.useMemoryDB) {
      const messages = memoryMessages.filter(m => m.patientId === patientId);
      return res.json({ messages });
    } else {
      const messages = await Consultation.find({ patientId }).sort({ timestamp: 1 });
      return res.json({ messages });
    }
  } catch (error) {
    console.error('Error fetching telemed messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Post a message and get a real-time simulated reply if patient sent it
router.post('/messages', async (req, res) => {
  try {
    const { patientId, sender, senderName, message } = req.body;
    
    if (!patientId || !sender || !senderName || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newMessage = {
      patientId,
      sender,
      senderName,
      message,
      timestamp: new Date()
    };
    
    let savedMessage = null;
    
    if (global.useMemoryDB) {
      memoryMessages.push(newMessage);
      savedMessage = newMessage;
    } else {
      const consultation = new Consultation(newMessage);
      savedMessage = await consultation.save();
    }
    
    // Simulate real-time response from rehabilitation specialist if the sender is the patient
    let simulatedReply = null;
    if (sender === 'patient') {
      let replyText = "รับทราบข้อความและอาการครับ ขณะนี้ผลสถิติจลนศาสตร์ล่าสุดของท่านได้รับการอัปโหลดขึ้นแดชบอร์ดนักกายภาพบำบัดเรียบร้อยแล้ว หมั่นฝึกซ้อมและรักษาสรีระให้ตรงอยู่เสมอนะครับ มีคำถามอื่นสามารถฝากไว้ได้ตลอดเวลาครับ";
      
      const lowercaseMsg = message.toLowerCase();
      if (lowercaseMsg.includes('ปวด') || lowercaseMsg.includes('ไหล่') || lowercaseMsg.includes('เจ็บ')) {
        replyText = "หากมีอาการตึงไหล่หรือเจ็บสะสมขณะทำกิจกรรม ROM แนะนำให้พักข้อต่อ 2-3 นาที หรือบีบผ้าอุ่นประคบนะครับ หากยังเกร็งไม่ดีขึ้นให้ลดมุมการเอื้อมเป้าลงก่อนเพื่อความปลอดภัยครับ";
      } else if (lowercaseMsg.includes('สั่น') || lowercaseMsg.includes('เกร็ง') || lowercaseMsg.includes('สั่นเกร็ง')) {
        replyText = "สำหรับอาการสั่นเกร็งของข้อมือ (Jitter) ระหว่างเอื้อมแตะ แนะนำให้เน้นการควบคุมทิศทางอย่างช้าๆ และผ่อนคลาย ไม่จำกัดความเร็ว หรือหาหมอนรองใต้ข้อศอกเพื่อลดแรงต้านของกล้ามเนื้อสะบักไหล่ครับ";
      } else if (lowercaseMsg.includes('ละเลย') || lowercaseMsg.includes('ลืมใช้') || lowercaseMsg.includes('ไม่เลือก')) {
        replyText = "หากสัดส่วนการเอื้อมใช้มืออ่อนแรง (Limb Selection Ratio) ยังน้อย แนะนำให้ลองฝึกโหมด Forced Target เพิ่มเติม หรือชวนให้บุคคลในครอบครัวช่วยกระตุ้นให้ใช้งานมือข้างอ่อนแรงในการใช้ชีวิตประจำวันบ่อยขึ้นเพื่อก้าวข้ามภาวะ Learned Non-Use นะครับ";
      } else if (lowercaseMsg.includes('ท้อ') || lowercaseMsg.includes('เหนื่อย') || lowercaseMsg.includes('เบื่อ')) {
        replyText = "เข้าใจความรู้สึกเลยครับ การฟื้นฟูระบบประสาทต้องใช้เวลาและความสม่ำเสมอ วันนี้พัฒนาการจลนศาสตร์โดยรวมของคุณพัฒนาขึ้นจากวันแรกมากแล้วครับ ค่อยๆ ฝึกสลับโหมดเกมวันละนิดเพื่อไม่ให้เบื่อนะครับ เอาใจช่วยเสมอครับ!";
      }
      
      simulatedReply = {
        patientId,
        sender: 'therapist',
        senderName: 'กภ. วิชัย (นักกายภาพบำบัด - ตอบกลับอัตโนมัติ)',
        message: replyText,
        timestamp: new Date(Date.now() + 1000) // 1 second later
      };
      
      if (global.useMemoryDB) {
        memoryMessages.push(simulatedReply);
      } else {
        const replyConsultation = new Consultation(simulatedReply);
        await replyConsultation.save();
      }
    }
    
    res.status(201).json({
      message: 'Message saved successfully',
      newMessage: savedMessage,
      simulatedReply: simulatedReply
    });
    
  } catch (error) {
    console.error('Error posting telemed message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
