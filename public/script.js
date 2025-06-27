document.addEventListener('DOMContentLoaded', () => {
    const talkBtn = document.getElementById('talk-btn');
    const userTextElem = document.getElementById('user-text');
    const geminiTextElem = document.getElementById('gemini-text');
    const statusElem = document.getElementById('status');

    // ตรวจสอบว่าเบราว์เซอร์รองรับ Web Speech API หรือไม่
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        statusElem.textContent = 'ขออภัย เบราว์เซอร์ของคุณไม่รองรับ Voice Recognition';
        talkBtn.disabled = true;
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH'; // ตั้งค่าภาษาเป็นไทย
    recognition.interimResults = false; // ไม่ต้องการผลลัพธ์ระหว่างพูด
    recognition.maxAlternatives = 1;

    let isListening = false;

    // เมื่อกดปุ่ม
    talkBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            return;
        }
        recognition.start();
    });

    // Event handlers ของ Recognition
    recognition.onstart = () => {
        isListening = true;
        talkBtn.textContent = '...';
        talkBtn.classList.add('listening');
        statusElem.textContent = 'สถานะ: กำลังฟัง...';
        userTextElem.textContent = 'คุณพูดว่า: ...';
        geminiTextElem.textContent = 'Gemini ตอบว่า: ...';
    };

    recognition.onend = () => {
        isListening = false;
        talkBtn.textContent = '🎤';
        talkBtn.classList.remove('listening');
        statusElem.textContent = 'สถานะ: ว่าง';
    };

    recognition.onerror = (event) => {
        statusElem.textContent = `เกิดข้อผิดพลาด: ${event.error}`;
    };

    // เมื่อได้ผลลัพธ์จากการพูด
    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        userTextElem.textContent = `คุณพูดว่า: ${transcript}`;
        statusElem.textContent = 'สถานะ: กำลังประมวลผล...';

        // ส่งข้อความไปที่ Backend
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: transcript }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            const geminiResponse = data.response;

            geminiTextElem.textContent = `Gemini ตอบว่า: ${geminiResponse}`;
            speak(geminiResponse);

        } catch (error) {
            console.error('Error fetching from backend:', error);
            geminiTextElem.textContent = `เกิดข้อผิดพลาดในการสื่อสารกับเซิร์ฟเวอร์`;
        }
    };

    // ฟังก์ชันสำหรับให้เบราว์เซอร์พูด
    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'th-TH'; // ตั้งค่าภาษาพูด
            utterance.rate = 1; // ความเร็วในการพูด
            window.speechSynthesis.speak(utterance);
        } else {
            statusElem.textContent = 'ขออภัย เบราว์เซอร์ของคุณไม่รองรับ Text-to-Speech';
        }
    }
});