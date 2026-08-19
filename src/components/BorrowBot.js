'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/data/mockData';
import styles from './BorrowBot.module.css';

import { useData } from '@/context/DataContext';

export default function BorrowBot() {
    const { items } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'สวัสดีครับ! ผม BorrowBot 🤖 ให้ผมช่วยหาอุปกรณ์ที่เหมาะกับกิจกรรมของคุณไหมครับ? (เช่น พิมพ์ "ถ่ายรูป" หรือ "เตะบอล")', sender: 'bot', recommendations: [] }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        const newMessages = [...messages, { id: Date.now(), text: userMsg, sender: 'user' }];
        setMessages(newMessages);
        setInput('');

        // Simulate thinking delay
        setTimeout(() => {
            const userText = userMsg.toLowerCase();

            // Conversational rules
            if (userText.includes('สวัสดี') || userText.includes('ดีครับ') || userText.includes('ดีจ้า')) {
                setMessages(prev => [...prev, { id: Date.now(), text: 'สวัสดีครับ! ยินดีที่ได้รู้จัก มีอะไรให้ผมช่วยหาไหมเอ่ย เดี๋ยวดึงจากโกดังให้เลยครับ!', sender: 'bot' }]);
                return;
            }
            if (userText.includes('ขอบคุณ') || userText.includes('แต้งกิ้ว')) {
                setMessages(prev => [...prev, { id: Date.now(), text: 'ยินดีเสมอครับ 💙 ขอให้สนุกกับการใช้อุปกรณ์นะครับ!', sender: 'bot' }]);
                return;
            }

            const allAvailableItems = items?.filter(i => i.status === 'available') || [];

            // Generic Inventory inquiries (Use root words for better Thai language matching without spaces)
            const isGenericQuery = userText.includes('มีอะไร') || userText.includes('มีของ') || userText.includes('ทั้งหมด') || userText.includes('แนะนำ') || userText.includes('อะไรว่าง');

            if (isGenericQuery) {
                if (allAvailableItems.length === 0) {
                    setMessages(prev => [...prev, { id: Date.now(), text: 'ตอนนี้ในระบบไม่มีของว่างให้ยืมเลยครับ โดนยืมไปหมดแล้ว 😭', sender: 'bot' }]);
                    return;
                }

                // Get 3 random available items
                const shuffled = [...allAvailableItems].sort(() => 0.5 - Math.random());
                const recommendations = shuffled.slice(0, 3).map(i => ({ id: i.id, name: i.name }));

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: `ตอนนี้เรามีของว่างให้ยืมทั้งหมด ${allAvailableItems.length} ชิ้นครับ! นี่คือตัวอย่างของฮิตๆ ที่ว่างอยู่ตอนนี้:`,
                    sender: 'bot',
                    recommendations: recommendations
                }]);
                return;
            }

            // Keyword to Category mapped intelligence
            const intentMap = {
                'ถ่ายรูป': ['camera', 'cam_accessories'],
                'รูป': ['camera'],
                'กล้อง': ['camera', 'cam_accessories'],
                'เตะบอล': ['sports'],
                'กีฬา': ['sports'],
                'พรีเซนต์': ['projector', 'laptop', 'cable'],
                'ทำงาน': ['laptop', 'cable'],
                'คอม': ['laptop'],
                'ดนตรี': ['music'],
                'กีตาร์': ['music']
            };

            let matchedCategories = [];
            for (const [key, cats] of Object.entries(intentMap)) {
                if (userText.includes(key)) {
                    matchedCategories.push(...cats);
                }
            }

            // Search real items that are actually AVAILABLE
            const foundItems = items?.filter(item => {
                if (item.status !== 'available') return false;

                const nameMatch = item.name.toLowerCase().includes(userText);
                const descMatch = item.description?.toLowerCase().includes(userText);
                const catMatch = matchedCategories.includes(item.category);

                return nameMatch || descMatch || catMatch;
            });

            // Limit to top 3 recommendations
            const recommendations = foundItems?.slice(0, 3).map(i => ({ id: i.id, name: i.name })) || [];

            let botReply = '';
            if (recommendations.length > 0) {
                botReply = `เจอแล้วครับ! สำหรับสิ่งที่คุณตามหา ผมมีของที่พร้อมยืมในคลังตอนนี้เลย:`;
            } else {
                botReply = 'ขออภัยครับ ตอนนี้ผมหาของที่ตรงกับกิจกรรมไม่เจอ หรือของอาจจะโดนยืมไปหมดยังไม่มีเครื่องว่างเลยครับ 🥺 ลองค้นหาด้วยคำง่ายๆ แบบอื่นดูไหมครับ?';
            }

            setMessages(prev => [...prev, {
                id: Date.now(),
                text: botReply,
                sender: 'bot',
                recommendations: recommendations
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
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="พิมพ์กิจกรรมของคุณที่นี่..."
                            className={styles.chatInput}
                        />
                        <button onClick={handleSend} className={styles.sendBtn} disabled={!input.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
