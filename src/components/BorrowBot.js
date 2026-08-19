'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, ChevronUp, ChevronDown, Mic } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/data/mockData';
import styles from './BorrowBot.module.css';

import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';

// Helper: Levenshtein Distance for Typo Tolerance (Fuzzy Matching)
const getEditDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1) // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export default function BorrowBot() {
    const { items, borrows } = useData();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'สวัสดีครับ! ผม BorrowBot 🤖 ให้ผมช่วยหาอุปกรณ์ หรือเช็คสถานะของที่ยืมไปแล้วไหมครับ? (เช่น พิมพ์ "ถ่ายรูป" หรือ "เช็คสถานะการยืม")', sender: 'bot', recommendations: [] }
    ]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [botContext, setBotContext] = useState({ lastCategories: [], lastTerm: [], lastShown: [] });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Speech-to-Text Setup
    const handleVoiceClick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMessages(prev => [...prev, { id: Date.now(), text: 'ขออภัยครับ เบราว์เซอร์ของคุณยังไม่รองรับระบบสั่งงานด้วยเสียง 🥺', sender: 'bot' }]);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'th-TH';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        const newMessages = [...messages, { id: Date.now(), text: userMsg, sender: 'user' }];
        setMessages(newMessages);
        setInput('');

        // Simulate thinking delay
        setTimeout(() => {
            const userText = userMsg.toLowerCase();
            let botReplyData = null;

            // 0. Conversational Small Talk Engine (Chit-chat) - MASSIVELY EXPANDED
            const chitChatMap = [
                // Greetings
                { match: ['สวัสดี', 'ดีครับ', 'ดีจ้า', 'หวัดดี', 'hello', 'hi', 'ฮัลโหล', 'ทักทาย'], reply: 'สวัสดีครับ! ผม BorrowBot ยินดีที่ได้รู้จัก มีอะไรให้ผมช่วยหาจากโกดังไหมเอ่ย?' },
                { match: ['ทำไรอยู่', 'ทำอะไรอยู่', 'ทำไร', 'ว่างไหม'], reply: 'กำลังสแตนด์บายเฝ้าคลังของให้คุณอยู่ครับ! อยากยืมอะไรบอกผมมาได้เลย 😎' },
                { match: ['กินข้าว', 'หิว', 'ของกิน', 'ข้าว', 'แดก'], reply: 'ผมเป็นบอท กินไฟเป็นอาหารครับ ⚡️ แต่ถ้าคุณหิว ลองยืมไมโครเวฟไปอุ่นข้าวไหมครับ? (ล้อเล่นนนน)' },
                { match: ['ง่วง', 'นอน', 'สลบ', 'หลับ'], reply: 'ง่วงก็ไปพักนะครับ 😴 ร่างกายต้องการการพักผ่อน แต่ถ้าจะยืมของดึกๆ ผมบริการให้ 24 ชม. ครับ!' },

                // Bantor / Flirting
                { match: ['รักนะ', 'จีบ', 'น่ารักจัง', 'โสดไหม', 'มีแฟนยัง', 'คิดถึง', 'น่ารักอะ'], reply: 'เขินเลยครับ 😳 ผมทำงานให้คุณฟรีๆ ไม่คิดเงิน แถมไม่มีแฟนด้วยครับ สบายใจได้!' },
                { match: ['กวนตีน', 'กวน', 'อะไรวะ', 'ปั่น', 'หิวแสง'], reply: 'แหะๆ ขอโทษทีครับ ผมอาจจะยังเรียนรู้ภาษาคนไม่ร้อยเปอร์เซ็นต์ แต่อยากช่วยจริงๆ น้า 🥺' },
                { match: ['ด่า', 'เหี้ย', 'สัส', 'ควย', 'สัด', 'เวร', 'แม่ง', 'โง่'], reply: 'ใจเย็นๆ ก่อนเกรี้ยวกราดเด้อครับ � ผมสัมผัสได้ถึงพลังงานบางอย่าง ค่อยๆ พิมพ์หาของกันดีกว่าครับผม' },

                // Empathy / Support
                { match: ['เครียด', 'เหนื่อย', 'เศร้า', 'เบื่อ', 'ท้อ', 'ไม่ไหว', 'ร้องไห้', 'แย่'], reply: 'โอ๋ๆ ไม่เป็นไรนะครับ พักผ่อนสูดหายใจลึกๆ ดื่มน้ำเย็นๆ ซักแก้ว ทุกอย่างจะดีขึ้นครับ 💙 หรือจะยืมเกมไปพักสมองล่ะ?' },
                { match: ['ดีมาก', 'สุดยอด', 'เก่ง', 'ฉลาด', 'เจ๋ง', 'เยี่ยม', 'กู๊ด'], reply: 'ขอบคุณที่ชมครับ! ผมถูกสร้างมาเพื่อเป็นผู้ช่วยที่เก่งที่สุดของคุณเลยล่ะ 👏' },

                // Knowledge / Meta
                { match: ['ชื่ออะไร', 'เป็นใคร', 'คือใคร', 'คุณคือ', 'บอท', 'ใครสร้าง'], reply: 'ผมคือ BorrowBot ครับ! ผู้ช่วยประจำคลังพัสดุ ผมมีหน้าที่ช่วยคุณค้นหาและยืมอุปกรณ์ต่างๆ อย่างรวดเร็วครับ' },
                { match: ['ยืมยังไง', 'ทำไง', 'วิธียืม', 'ทำยังไง', 'ยืมของคืองง', 'ขอวิธียืม'], reply: 'วิธียืมง่ายมากๆ ครับ พิมพ์บอกผมว่าอยากได้อะไร จากนั้นกดเข้าไปที่ของชิ้นนั้น แล้วกดปุ่ม ยืมอุปกรณ์ จากนั้นรอแอดมินอนุมัติแล้วมารับของได้เลย!' },
                { match: ['ทำอะไรได้บ้าง', 'ความสามารถ', 'ทำไรได้', 'ใช้ยังไง'], reply: 'ผมช่วยคุณหาของในคลัง (เช่น พิมพ์ ดนตรี) หรือเช็คสถานะการยืมให้คุณ (พิมพ์ เช็คสถานะ) และยังคุยเล่นเป็นเพื่อนแก้เหงาได้ด้วยครับ 😜' },

                // Gratitude
                { match: ['ขอบคุณ', 'แต้งกิ้ว', 'ใจจ้า', 'ขอบใจ', 'thank'], reply: 'ยินดีเสมอครับ 💙 ขอให้สนุกกับการใช้อุปกรณ์นะครับ!' }
            ];

            // Check chit-chat first
            let isSmallTalk = false;
            for (const chat of chitChatMap) {
                if (chat.match.some(word => userText.includes(word))) {
                    botReplyData = { id: Date.now(), text: chat.reply, sender: 'bot' };
                    isSmallTalk = true;
                    break;
                }
            }

            if (isSmallTalk) {
                setMessages(prev => [...prev, botReplyData]);
                speakText(botReplyData.text);
                return;
            }

            // 1. Status Tracking Logic (Idea 6)
            const isStatusQuery = userText.includes('สถานะ') || userText.includes('ของที่ยืม') || userText.includes('ยืมไป') || userText.includes('คืนเมื่อไหร่') || userText.includes('เช็ค') || userText.includes('กี่ชิ้น') || userText.includes('คืนของ') || userText.includes('ต้องคืน');

            if (isStatusQuery && user) {
                const userBorrows = borrows?.filter(b => b.userId === user.id && ['pending', 'approved', 'borrowed'].includes(b.status)) || [];

                if (userBorrows.length === 0) {
                    const text = 'ตอนนี้คุณไม่มีรายการยืมที่ค้างอยู่เลยครับผม สนใจยืมอะไรเพิ่มไหมเอ่ย?';
                    setMessages(prev => [...prev, { id: Date.now(), text: text, sender: 'bot' }]);
                    return;
                }

                let reply = `คุณมีรายการยืมที่กำลังดำเนินการอยู่ ${userBorrows.length} รายการครับ\n`;
                userBorrows.forEach((b, idx) => {
                    reply += `${idx + 1}. ${b.itemName} (สถานะ: ${b.status === 'borrowed' ? 'กำลังยืม - รอคืน 📦' : 'กำลังดำเนินการ ⏳'})\n`;
                });

                setMessages(prev => [...prev, { id: Date.now(), text: reply, sender: 'bot' }]);
                return;
            }

            // 2. Generic Inventory inquiries
            const isGenericQuery = userText.includes('มีอะไร') || userText.includes('มีของ') || userText.includes('ทั้งหมด') || userText.includes('แนะนำ') || userText.includes('อะไรว่าง');

            if (isGenericQuery) {
                const allAvailableItems = items?.filter(i => i.status === 'available') || [];
                if (allAvailableItems.length === 0) {
                    const text = 'ตอนนี้ในระบบไม่มีของว่างให้ยืมเลยครับ โดนยืมไปหมดแล้ว';
                    setMessages(prev => [...prev, { id: Date.now(), text: text, sender: 'bot' }]);
                    return;
                }
                const shuffled = [...allAvailableItems].sort(() => 0.5 - Math.random());
                const recommendations = shuffled.slice(0, 3).map(i => ({ id: i.id, name: i.name }));
                const text = `ตอนนี้เรามีของว่างให้ยืมทั้งหมด ${allAvailableItems.length} ชิ้นครับ! ลองดูของฮิตๆ พวกนี้ไหมครับ`;
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: text,
                    sender: 'bot',
                    recommendations: recommendations
                }]);
                return;
            }

            // SMART NLP SCORING ENGINE
            const tokens = userText.split(/\s+/).filter(t => t.length > 0);

            if (userText.length === 0) {
                const text = 'อยากให้ผมช่วยหาบรรดาอุปกรณ์แนวไหน หรือของสำหรับทำกิจกรรมอะไรดีครับ?';
                setMessages(prev => [...prev, { id: Date.now(), text: text, sender: 'bot' }]);
                return;
            }

            // 2. Score mapping (Massively expanded with slang & Thai context matrix)
            // Fix: Thai sentences don't have spaces, so we search for matrix words INSIDE the raw user string.
            const vocabMatrix = [
                { words: ['ถ่ายรูป', 'กล้อง', 'แชะ', 'เซลฟี่', 'เลนส์', 'ขาตั้ง', 'แฟลช'], hardwareTags: ['กล้อง', 'เลนส์', 'ขาตั้ง', 'แฟลช', 'camera', 'dslr', 'mirrorless'], cat: 'electronics' },
                { words: ['พรีเซนต์', 'นำเสนอ', 'โปรเจคเตอร์', 'จอ', 'นำเสนองาน', 'hdmi', 'พอยต์เตอร์'], hardwareTags: ['โปรเจคเตอร์', 'จอ', 'สาย', 'hdmi', 'pointer', 'จอภาพ', 'projector'], cat: 'electronics' },
                { words: ['ทำงาน', 'พิมพ์งาน', 'โน้ตบุ๊ก', 'แล็ปท็อป', 'คอม', 'mac', 'ipad', 'แมค'], hardwareTags: ['โน้ตบุ๊ก', 'คอม', 'mac', 'ipad', 'แท็บเล็ต', 'laptop', 'macbook'], cat: 'electronics' },
                { words: ['เขียน', 'จด', 'วาด', 'ปากกา', 'ดินสอ', 'ไอแพด', 'ipad', 'เครื่องเขียน'], hardwareTags: ['ปากกา', 'ดินสอ', 'ipad', 'apple pencil', 'pen', 'ยางลบ', 'สี'], cat: 'stationery' },
                { words: ['เตะบอล', 'บอล', 'ฟุตบอล', 'กีฬา', 'ออกกำลัง', 'วิ่ง', 'แบด', 'ปิงปอง', 'บาส'], hardwareTags: ['ฟุตบอล', 'ลูกบอล', 'ไม้แบด', 'รองเท้า', 'บาส', 'ลูกบาส', 'ปิงปอง'], cat: 'sports' },
                { words: ['สอบ', 'อ่านหนังสือ', 'ติว', 'หนังสือ', 'ความรู้', 'เรียน', 'ทบทวน'], hardwareTags: ['หนังสือ', 'นิยาย', 'เรียน', 'คู่มือ', 'book', 'สมุด'], cat: 'books' },
                { words: ['ดนตรี', 'กีตาร์', 'เพลง', 'เสียง', 'ไมค์', 'ร้องเพลง', 'ลำโพง', 'ร้องคาราโอเกะ'], hardwareTags: ['กีตาร์', 'ไมค์', 'ลำโพง', 'หูฟัง', 'อูคูเลเล่', 'กลอง'], cat: 'others' },
                { words: ['แบตหมด', 'ชาร์จ', 'สายชาร์จ', 'ปลั๊ก', 'พาวเวอร์แบงค์', 'แบตสำรอง', 'adapter'], hardwareTags: ['สายชาร์จ', 'ปลั๊ก', 'แบต', 'powerbank', 'adapter', 'เต้าเสียบ'], cat: 'electronics' },
                { words: ['ตัดต่อ', 'กราฟิก', 'เรนเดอร์', 'วิดีโอ'], hardwareTags: ['macbook', 'คอม', 'จอ', 'เมาส์', 'คอมพิวเตอร์'], cat: 'electronics' }
            ];

            let activeHardwareTags = [];
            let activeCategories = [];

            // Context Memory (Idea 3) - Restore context if it's a follow-up
            // Expanded Thai conversational follow-up triggers
            const followUpTriggers = ['อีก', 'อันอื่น', 'แล้ว', 'ขอเพิ่ม', 'มีอีก', 'มั้ย', 'ปะ', 'ป่าว', 'ละ', 'อื่นๆ', 'มากกว่าขี้', 'เพิ่ม'];
            const isFollowUp = followUpTriggers.some(word => userText.includes(word));

            vocabMatrix.forEach(entry => {
                let isMatch = false;
                // Check exact word inclusions within the continuous string
                entry.words.forEach(word => {
                    if (userText.includes(word)) {
                        isMatch = true;
                    } else if (word.length >= 4) {
                        // Tolerate minor typos in long Thai words by checking split pieces
                        // (Simplified fuzzy threshold by checking if partial parts trigger)
                        if (getEditDistance(userText, word) <= 2) isMatch = true;
                    }
                });

                if (isMatch) {
                    activeHardwareTags.push(...entry.hardwareTags);
                    activeCategories.push(entry.cat);
                }
            });

            if (isFollowUp && activeHardwareTags.length === 0 && botContext.lastCategories.length > 0) {
                activeHardwareTags = [...botContext.lastTerm];
                activeCategories = [...botContext.lastCategories];
            } else if (activeHardwareTags.length > 0) {
                // Save New Context, reset lastShown history if this is a fresh search
                if (!isFollowUp) {
                    setBotContext(prev => ({ ...prev, lastCategories: activeCategories, lastTerm: activeHardwareTags, lastShown: [] }));
                } else {
                    setBotContext(prev => ({ ...prev, lastCategories: activeCategories, lastTerm: activeHardwareTags }));
                }
            }

            // 3. Evaluate and Score ALL items using the dynamic Matrix
            const scoredItems = (items || []).map(item => {
                let score = 0;
                const itemName = item.name.toLowerCase();
                const itemDesc = item.description?.toLowerCase() || '';

                // Massive score for hardware keyword alignment
                activeHardwareTags.forEach(tag => {
                    if (itemName.includes(tag)) score += 15;
                    else if (itemDesc.includes(tag)) score += 5;
                });

                // Baseline score for raw text matches (fallback)
                // Remove spaces and check if the user physically typed an item's exact name
                if (userText.includes(itemName) || itemName.includes(userText)) score += 8;

                // Category match
                if (activeCategories.includes(item.category)) {
                    score += 3;
                }

                return { ...item, _botScore: score };
            });

            // 4. Sort by highest score
            scoredItems.sort((a, b) => b._botScore - a._botScore);

            // 5. Filter top results above threshold
            const bestMatches = scoredItems.filter(i => i._botScore >= 2);

            // Separation of available vs out-of-stock
            const availableMatches = bestMatches.filter(i => i.status === 'available');
            const outOfStockMatches = bestMatches.filter(i => i.status !== 'available');

            let botReply = '';
            let finalRecs = [];

            if (availableMatches.length > 0) {
                // Determine which items to show
                let itemsToShow = availableMatches;

                if (isFollowUp) {
                    // Exclude items already shown in the current conversational context
                    itemsToShow = itemsToShow.filter(item => !botContext.lastShown.includes(item.id));
                }

                if (itemsToShow.length === 0) {
                    botReply = 'ค้นทั่วคลังแล้วครับ ของสเปคแนวนี้ที่มีพร้อมให้ยืมหมดเกลี้ยงแล้วจริงๆ 🥺 ลองเปลี่ยนแนวดูไหมครับ?';
                    setMessages(prev => [...prev, { id: Date.now(), text: botReply, sender: 'bot' }]);
                    return;
                }

                finalRecs = itemsToShow.slice(0, 3).map(i => ({ id: i.id, name: i.name }));

                // Save shown items to prevent them from showing up again on the next "มีอีกไหม"
                setBotContext(prev => ({ ...prev, lastShown: [...prev.lastShown, ...finalRecs.map(r => r.id)] }));

                const topScore = itemsToShow[0]._botScore;
                if (isFollowUp) {
                    botReply = `พยายามไปรื้อมาให้แล้วครับ! ได้ของใหม่มาเพิ่ม สดๆ ร้อนๆ:`;
                } else if (topScore >= 5) {
                    botReply = `เจอแล้วครับ! สำหรับสิ่งที่คุณตามหา ผมค้นเจอของที่ตรงสเปคและว่างอยู่ตอนนี้เลย:`;
                } else {
                    botReply = `ผมลองค้นหาของที่น่าจะใกล้เคียงกับความต้องการของคุณมาให้ครับ หยิบไปใช้ได้เลย:`;
                }
            } else if (outOfStockMatches.length > 0) {
                // Out of Stock Alert System (Idea 4)
                const missingItem = outOfStockMatches[0].name;
                botReply = `ผมเจอประวัติอุปกรณ์ที่คุณหาครับ (ยกตัวอย่างเช่น ${missingItem}) แต่ตอนนี้ของโดนยืมเรียบเลยเกลี้ยงคลัง 🥺\nให้ผมล็อกคิวส่งแจ้งเตือนให้คุณทันทีที่ของถูกนำมาคืนไหมครับ?`;
            } else {
                botReply = 'ขออภัยครับ ตอนนี้ผมหาของที่ตรงกับกิจกรรมไม่เจอ หรือของอาจจะไม่มีในระบบเลยครับ 🥺 ลองใช้คำค้นหาแบบอื่นดูได้ไหมครับ? (เช่น เปลี่ยนจาก "วาดรูป" เป็น "ไอแพด")';
            }

            setMessages(prev => [...prev, {
                id: Date.now(),
                text: botReply,
                sender: 'bot',
                recommendations: finalRecs
            }]);
        }, 800);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className={`${styles.botContainer} ${isOpen ? styles.open : ''}`}>
            {/* Toggle Button */}
            <button
                className={styles.botToggle}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle BorrowBot"
            >
                <Bot size={24} />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className={styles.chatWindow}>
                    <div className={styles.chatHeader}>
                        <div className={styles.headerInfo}>
                            <Bot size={20} className={styles.headerIcon} />
                            <h3>BorrowBot</h3>
                            <span className={styles.statusDot}></span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    <div className={styles.messagesArea}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.userWrapper : styles.botWrapper}`}>
                                <div className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.userBubble : styles.botBubble}`}>
                                    {msg.text}
                                </div>

                                {/* Recommendations (if any) */}
                                {msg.recommendations && msg.recommendations.length > 0 && (
                                    <div className={styles.recommendationsList}>
                                        {msg.recommendations.map(item => (
                                            <Link href={`/items/${item.id}`} key={item.id} className={styles.recItem}>
                                                <span>📱 {item.name}</span>
                                                <ChevronUp size={14} className={styles.recArrow} style={{ transform: 'rotate(90deg)' }} />
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.inputArea}>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="พิมพ์กิจกรรมของคุณ..."
                                className={styles.chatInput}
                            />
                            <button
                                className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                                onClick={handleVoiceClick}
                                title="กดเพื่อพูด"
                            >
                                <Mic size={18} color={isListening ? 'var(--danger)' : 'var(--text-secondary)'} />
                            </button>
                            <button onClick={handleSend} className={styles.sendBtn} disabled={!input.trim()}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
