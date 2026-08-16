'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Image as ImageIcon, CheckCircle2, Upload, X } from 'lucide-react';
import { categories } from '@/data/mockData';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AdminNewItemPage() {
    const router = useRouter();
    const { addItem } = useData();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'electronics',
        condition: 'ดี',
        location: '',
        quantity: 1,
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Compress image to Base64 to save directly to Firestore
    const compressImageToBase64 = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress as JPEG with 70% quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        setSubmitError('');

        try {
            let imageUrl = null;
            if (imageFile) {
                // Remove Firebase storage requirement! We just use Base64 directly
                imageUrl = await compressImageToBase64(imageFile);
            }

            await addItem({
                ...formData,
                ownerId: user.id,
                ownerName: user.name,
                image: imageUrl
            });

            setSubmitted(true);
            setTimeout(() => {
                router.push('/admin/items');
            }, 1500);
        } catch (err) {
            console.error("Error submitting item:", err);
            setSubmitError(`เกิดข้อผิดพลาด: ${err.message || 'กรุณาลองใหม่ (เช็ค Firestore/Storage Rules)'}`);
        } finally {
            setUploading(false);
        }
    };

    const selectedCategory = categories.find(c => c.id === formData.category);

    if (submitted) {
        return (
            <div className="page-container">
                <div className={styles.successContainer}>
                    <CheckCircle2 size={64} className={styles.successIcon} />
                    <h2>เพิ่มของสำเร็จ!</h2>
                    <p>ของถูกเพิ่มเข้าสู่ระบบแล้ว</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: '16px' }}>
                <ArrowLeft size={18} /> กลับ
            </button>

            <div className="page-header">
                <h1>เพิ่มของใหม่</h1>
                <p>เพิ่มของเข้าสู่ระบบเพื่อให้ผู้ใช้ยืม</p>
            </div>

            <div className={styles.formGrid}>
                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {submitError && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{submitError}</div>}

                    <div className="input-group">
                        <label>ชื่อรายการ *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="เช่น MacBook Pro, กีตาร์ Yamaha..."
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>รายละเอียด *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="อธิบายรายละเอียดของ สภาพ และข้อมูลที่เป็นประโยชน์..."
                            rows={4}
                            style={{ resize: 'vertical' }}
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className="input-group">
                            <label>หมวดหมู่</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="input-field"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label>สภาพ</label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="ดีมาก">ดีมาก</option>
                                <option value="ดี">ดี</option>
                                <option value="พอใช้">พอใช้</option>
                                <option value="ต้องระวัง">ต้องระวัง</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className="input-group">
                            <label>สถานที่ / ตำแหน่ง *</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="เช่น ตึก IT ชั้น 3, หอพัก A ห้อง 205..."
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>จำนวน (ชิ้น) *</label>
                            <input
                                type="number"
                                min="1"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>รูปภาพ</label>
                        <div
                            className={styles.uploadArea}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: 'pointer', overflow: 'hidden', padding: imagePreview ? '0' : '2rem' }}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <Upload size={32} />
                                    <p>คลิกเพื่อเลือกไฟล์รูปภาพ</p>
                                    <span>PNG, JPG ขนาดไม่เกิน 5MB</span>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleImageChange}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={uploading}>
                        {uploading ? 'กำลังอัปโหลดและเพิ่ม...' : 'เพิ่มของ'}
                    </button>
                </form>

                {/* Preview */}
                <div className={styles.previewSection}>
                    <h3>ตัวอย่าง</h3>
                    <div className={`card ${styles.previewCard}`}>
                        <div className={styles.previewImage}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span>{selectedCategory?.icon || '📦'}</span>
                            )}
                        </div>
                        <div className={styles.previewInfo}>
                            <h4>{formData.name || 'ชื่อรายการ'}</h4>
                            <p>{formData.description || 'รายละเอียด...'}</p>
                            <div className={styles.previewMeta}>
                                {formData.location && <span>📍 {formData.location}</span>}
                                <span>🏷️ {selectedCategory?.name || 'หมวดหมู่'}</span>
                            </div>
                            <span className="badge badge-available">ว่าง</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
