// Import ไลบรารีที่จำเป็น
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // โหลดค่าจากไฟล์ .env

// ตั้งค่า Express app
const app = express();
const port = 3000;

// Middleware สำหรับอ่าน JSON body และให้บริการไฟล์ static จากโฟลเดอร์ public
app.use(express.json());
app.use(express.static('public'));

// ตั้งค่า Gemini API
// ดึง API Key จาก environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // หรือใช้ 'gemini-pro'

// สร้าง Endpoint สำหรับการแชท
app.post('/chat', async (req, res) => {
    try {
        const userInput = req.body.prompt;
        if (!userInput) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // ส่ง prompt ไปยัง Gemini
        const result = await model.generateContent(userInput);
        const response = await result.response;
        const text = response.text();

        // ส่งคำตอบกลับไปให้ Frontend
        res.json({ response: text });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to get response from Gemini' });
    }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});