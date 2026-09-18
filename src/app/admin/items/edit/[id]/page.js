'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, CheckCircle2 } from 'lucide-react';
import { categories } from '@/data/mockData';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import styles from '../../new/page.module.css'; // Re-use the CSS

export default function AdminEditItemPage() {
    const router = useRouter();
    const params = useParams();
    const { items, updateItem } = useData();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'electronics',
        condition: 'ดี',
        location: '',
        quantity: 1,
        status: 'available',
        maintenanceReason: '',
        maintenanceCost: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const fileInputRef = useRef(null);

    // Initial load
    useEffect(() => {
        const item = items.find(i => i.id === params.id);
        if (item) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                name: item.name,
                description: item.description,
                category: item.category,
                condition: item.condition || 'ดี',
                location: item.location,
                quantity: item.quantity || 1,
                status: item.status,
                maintenanceReason: item.maintenanceReason || '',
                maintenanceCost: item.maintenanceCost || ''
            });
            setImagePreview(item.image || null);
        }
    }, [items, params.id]);

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
            let imageUrl = imagePreview; // Default to existing

            // If new file chosen, upload
            if (imageFile) {
                imageUrl = await compressImageToBase64(imageFile);
            }

            await updateItem(params.id, {
                ...formData,
                maintenanceCost: formData.maintenanceCost ? Number(formData.maintenanceCost) : 0,
                image: imageUrl
            });

            setSubmitted(true);
            setTimeout(() => {
                router.push('/admin/items');
            }, 1000);
        } catch (err) {
            console.error("Error updating item:", err);
            setSubmitError(`เกิดข้อผิดพลาดในการแก้ไข: ${err.message || 'รบกวนลองใหม่'}`);
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
                    <h2>บันทึกสำเร็จ!</h2>
                    <p>ข้อมูลสินค้าถูกอัปเดตเรียบร้อย</p>
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
                <h1>แก้ไขข้อมูล</h1>
                <p>ปรับปรุงรายละเอียดของของชิ้นนี้</p>
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
                        <div className="input-group">
                            <label>สถานะสินค้า</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="available">ว่าง / ให้ยืมได้</option>
                                <option value="maintenance">🛠️ กำลังส่งซ่อม / ชำรุด (Maintenance)</option>
                                <option value="unavailable">ซ่อมแซม / ไม่พร้อม</option>
                                <option value="borrowed">ถูกยืมอยู่ (บังคับเปลี่ยนสถานะ)</option>
                            </select>
                        </div>
                    </div>

                    {formData.status === 'maintenance' && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                            <h3 style={{ color: '#f59e0b', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🛠️ รายละเอียดการชำรุด / ส่งซ่อม
                            </h3>
                            <div className={styles.formRow}>
                                <div className="input-group" style={{ flex: 2 }}>
                                    <label>สาเหตุการชำรุด / อาการเสีย</label>
                                    <input
                                        type="text"
                                        name="maintenanceReason"
                                        placeholder="เช่น จอแตก, ขาตั้งหัก, เลนส์โฟกัสไม่ได้..."
                                        value={formData.maintenanceReason}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label>ประเมินค่าซ่อม (บาท)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="maintenanceCost"
                                        placeholder="0"
                                        value={formData.maintenanceCost}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>อัปเดตรูปภาพ</label>
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
                                    <p>คลิกเพื่อเปลี่ยนรูปภาพ</p>
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
                        {uploading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                    </button>
                </form>

                {/* Preview */}
                <div className={styles.previewSection}>
                    <h3>ตัวอย่าง</h3>
                    <div className={`card ${styles.previewCard}`}>
                        <div className={styles.previewImage}>
                            {imagePreview && typeof imagePreview === 'string' && !imagePreview.startsWith('blob:') ? (
                                <img src={imagePreview} alt="Preview thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : imagePreview && imagePreview.startsWith('blob:') ? (
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
