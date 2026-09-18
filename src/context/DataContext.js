'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import {
    notifyNewBorrowRequest,
    notifyBorrowApproved,
    notifyBorrowRejected,
    notifyBorrowReturned
} from '@/lib/emailService';

const DataContext = createContext(null);

export function DataProvider({ children }) {
    const [items, setItems] = useState([]);
    const [borrows, setBorrows] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Current user id for filtering notifications (set from outside)
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        // Listen to items collection
        const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
            const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(itemsList);
        }, (error) => {
            console.error("Error fetching items real-time:", error);
        });

        // Listen to borrows collection
        const unsubBorrows = onSnapshot(collection(db, 'borrows'), (snapshot) => {
            const borrowsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBorrows(borrowsList);
            setIsLoaded(true);
        }, (error) => {
            console.error("Error fetching borrows real-time:", error);
            setIsLoaded(true);
        });

        return () => {
            unsubItems();
            unsubBorrows();
        };
    }, []);

    // Listen to notifications for current user
    useEffect(() => {
        if (!currentUserId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setNotifications([]);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUserId),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const notifList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifList);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            // Fallback: try without orderBy if composite index not available
            const fallbackQ = query(
                collection(db, 'notifications'),
                where('userId', '==', currentUserId)
            );
            onSnapshot(fallbackQ, (snapshot) => {
                const notifList = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(notifList);
            });
        });

        return () => unsub();
    }, [currentUserId]);

    // --- Items ---
    const addItem = async (newItem) => {
        try {
            const itemData = {
                ...newItem,
                status: 'available',
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, 'items'), itemData);
        } catch (err) {
            console.error("Error adding item to Firestore:", err);
            throw err;
        }
    };

    const updateItem = async (id, updates) => {
        try {
            await updateDoc(doc(db, 'items', id), updates);
        } catch (err) {
            console.error("Error updating item in Firestore:", err);
            throw err;
        }
    };

    const deleteItem = async (id) => {
        try {
            await deleteDoc(doc(db, 'items', id));
        } catch (err) {
            console.error("Error deleting item in Firestore:", err);
            throw err;
        }
    };

    // --- Borrows ---
    const addBorrowRequest = async (request) => {
        try {
            const borrowData = {
                ...request,
                status: 'pending',
                borrowDate: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, 'borrows'), borrowData);

            // --- Autonomous Behavioral Loop (AI Auto-learning) ---
            try {
                if (typeof window !== 'undefined') {
                    const botPendingStr = sessionStorage.getItem('bot_pending_learn');
                    if (botPendingStr) {
                        const botPending = JSON.parse(botPendingStr);
                        const targetItem = items.find(i => i.id === request.itemId);

                        if (targetItem && botPending.text && botPending.docId) {
                            let itemTag = targetItem.name;
                            if (targetItem.tags && targetItem.tags.length > 0) {
                                itemTag = targetItem.tags[0]; // Use the first explicit tag if available
                            } else if (targetItem.name.includes(' ')) {
                                itemTag = targetItem.name.split(' ')[0]; // Fallback to first word of item name
                            }

                            // Add to vocabulary
                            await addDoc(collection(db, 'bot_vocabulary'), {
                                words: [botPending.text],
                                hardwareTags: [itemTag],
                                cat: targetItem.category || 'others'
                            });

                            // Mark original query as resolved
                            await updateDoc(doc(db, 'bot_unknown_queries', botPending.docId), {
                                status: 'resolved'
                            });

                            sessionStorage.removeItem('bot_pending_learn');
                            console.log("🤖 Autonomous AI Learned:", botPending.text, "->", itemTag);
                        }
                    }
                }
            } catch (botErr) {
                console.error("Behavioral Loop logic failed:", botErr);
            }
            // -----------------------------------------------------

            // Notify admin(s) about new borrow request
            await addNotification({
                userId: request.ownerId || 'admin',
                title: 'คำขอยืมใหม่',
                message: `${request.borrowerName} ขอยืม ${request.itemName}`,
                link: '/admin/borrows',
                type: 'borrow_request'
            });

            // Send email to admin(s) — fire and forget
            try {
                const adminSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
                adminSnapshot.forEach((adminDoc) => {
                    const adminData = adminDoc.data();
                    if (adminData.email) {
                        notifyNewBorrowRequest({
                            adminEmail: adminData.email,
                            borrowerName: request.borrowerName,
                            borrowerEmail: request.borrowerEmail || '',
                            itemName: request.itemName,
                            quantity: request.quantity,
                            reason: request.reason,
                            expectedReturnDays: request.expectedReturnDays,
                        });
                    }
                });
            } catch (emailErr) {
                console.error('Email notification failed (non-blocking):', emailErr);
            }

            return docRef;
        } catch (err) {
            console.error("Error requesting borrow in Firestore:", err);
            throw err;
        }
    };

    const updateBorrowStatus = async (id, newStatus, borrowData = null, options = {}) => {
        try {
            const borrow = borrowData || borrows.find(b => b.id === id);
            const updates = { status: newStatus };

            if (newStatus === 'returned') {
                updates.returnDate = new Date().toISOString();
                if (options.markMaintenance) {
                    updates.damageReported = true;
                    updates.damageReason = options.maintenanceReason || 'ส่งซ่อม/ชำรุด';
                    updates.damageCost = options.maintenanceCost || 0;
                }
            } else if (newStatus === 'active') {
                // Set due date based on expectedReturnDays
                const days = borrow?.expectedReturnDays || 7;
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + days);
                updates.dueDate = dueDate.toISOString();
            }

            await updateDoc(doc(db, 'borrows', id), updates);

            // --- Auto Inventory Deduction & Status Management ---
            if (borrow && borrow.itemId) {
                const item = items.find(i => i.id === borrow.itemId);
                if (item) {
                    const borrowQty = Number(borrow.quantity) || 1;
                    let currentAvailableQty = item.availableQuantity !== undefined ? item.availableQuantity : (item.quantity || 1);
                    let newItemStatus = item.status;
                    let shouldUpdateItem = false;
                    const itemExtraUpdates = {};

                    if (newStatus === 'active') {
                        currentAvailableQty = Math.max(0, currentAvailableQty - borrowQty);
                        if (currentAvailableQty === 0) {
                            newItemStatus = 'borrowed';
                        }
                        shouldUpdateItem = true;
                    } else if (newStatus === 'returned') {
                        // Add back to inventory
                        const maxQty = item.quantity || 1;
                        currentAvailableQty = Math.min(maxQty, currentAvailableQty + borrowQty);
                        
                        if (options.markMaintenance) {
                            newItemStatus = 'maintenance';
                            itemExtraUpdates.maintenanceReason = options.maintenanceReason || 'ชำรุดจากการยืมใช้งาน';
                            itemExtraUpdates.maintenanceCost = options.maintenanceCost || 0;
                            itemExtraUpdates.maintenanceReportedAt = new Date().toISOString();
                        } else if (currentAvailableQty > 0 && newItemStatus === 'borrowed') {
                            newItemStatus = 'available';
                        }
                        shouldUpdateItem = true;
                    }

                    if (shouldUpdateItem) {
                        await updateDoc(doc(db, 'items', item.id), {
                            availableQuantity: currentAvailableQty,
                            status: newItemStatus,
                            ...itemExtraUpdates
                        });
                    }
                }
            }
            // --------------------------------

            // Find the borrow record for notification
            if (borrow) {
                const statusMessages = {
                    active: { title: 'คำขอยืมอนุมัติแล้ว ✅', message: `คำขอยืม ${borrow.itemName || 'สินค้า'} ได้รับการอนุมัติ กำหนดคืน ${updates.dueDate ? new Date(updates.dueDate).toLocaleDateString('th-TH') : ''}`, type: 'borrow_approved' },
                    rejected: { title: 'คำขอยืมถูกปฏิเสธ ❌', message: `คำขอยืม ${borrow.itemName || 'สินค้า'} ถูกปฏิเสธ`, type: 'borrow_rejected' },
                    returned: { title: 'คืนของเรียบร้อย 📦', message: `${borrow.itemName || 'สินค้า'} ถูกรับคืนเรียบร้อยแล้ว${options.markMaintenance ? ' (มีบันทึกส่งซ่อม)' : ''}`, type: 'borrow_returned' },
                };

                const msg = statusMessages[newStatus];
                if (msg && borrow.borrowerId) {
                    await addNotification({
                        userId: borrow.borrowerId,
                        title: msg.title,
                        message: msg.message,
                        link: '/my-borrows',
                        type: msg.type
                    });

                    // Send email to borrower — fire and forget
                    try {
                        const borrowerDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', borrow.borrowerId)));
                        let borrowerEmail = '';
                        let borrowerName = borrow.borrowerName || 'ผู้ใช้';
                        borrowerDoc.forEach((d) => {
                            const data = d.data();
                            borrowerEmail = data.email || '';
                            borrowerName = data.name || borrowerName;
                        });

                        if (borrowerEmail) {
                            if (newStatus === 'active') {
                                notifyBorrowApproved({ borrowerEmail, borrowerName, itemName: borrow.itemName, dueDate: updates.dueDate });
                            } else if (newStatus === 'rejected') {
                                notifyBorrowRejected({ borrowerEmail, borrowerName, itemName: borrow.itemName });
                            } else if (newStatus === 'returned') {
                                notifyBorrowReturned({ borrowerEmail, borrowerName, itemName: borrow.itemName });
                            }
                        }
                    } catch (emailErr) {
                        console.error('Email notification failed (non-blocking):', emailErr);
                    }
                }
            }
        } catch (err) {
            console.error("Error updating borrow status in Firestore:", err);
            throw err;
        }
    };

    // Notify return from user
    const notifyReturnBorrow = async (borrowId, returnData) => {
        try {
            const borrow = borrows.find(b => b.id === borrowId);
            const updates = {
                status: 'pending_return',
                returnLocation: returnData.location || 'เคาน์เตอร์พัสดุ',
                returnCondition: returnData.condition || 'สมบูรณ์',
                returnNote: returnData.note || '',
                returnRequestedAt: new Date().toISOString()
            };

            await updateDoc(doc(db, 'borrows', borrowId), updates);

            // Notify admin
            await addNotification({
                userId: 'admin',
                title: 'ผู้ยืมแจ้งคืนของแล้ว 📦',
                message: `${borrow?.borrowerName || 'ผู้ยืม'} แจ้งคืน "${borrow?.itemName || 'อุปกรณ์'}" ที่ ${updates.returnLocation} (สภาพ: ${updates.returnCondition})`,
                link: '/admin/borrows',
                type: 'pending_return'
            });
        } catch (err) {
            console.error("Error notifying return in Firestore:", err);
            throw err;
        }
    };

    // Maintenance helper methods
    const reportItemMaintenance = async (itemId, maintenanceData) => {
        try {
            await updateDoc(doc(db, 'items', itemId), {
                status: 'maintenance',
                maintenanceReason: maintenanceData.reason || 'ส่งซ่อมบำรุง',
                maintenanceCost: Number(maintenanceData.cost) || 0,
                maintenanceReportedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error setting maintenance status:", err);
            throw err;
        }
    };

    const resolveItemMaintenance = async (itemId) => {
        try {
            await updateDoc(doc(db, 'items', itemId), {
                status: 'available',
                maintenanceReason: null,
                maintenanceCost: null,
                maintenanceResolvedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error resolving maintenance status:", err);
            throw err;
        }
    };

    // --- Notifications ---
    const addNotification = async (notif) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                ...notif,
                read: false,
                createdAt: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error adding notification:", err);
        }
    };

    const markNotificationRead = async (id) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllNotificationsRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.read).forEach(n => {
                batch.update(doc(db, 'notifications', n.id), { read: true });
            });
            await batch.commit();
        } catch (err) {
            console.error("Error marking all notifications as read:", err);
        }
    };

    const clearAllNotifications = async () => {
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                batch.delete(doc(db, 'notifications', n.id));
            });
            await batch.commit();
        } catch (err) {
            console.error("Error clearing notifications:", err);
        }
    };

    return (
        <DataContext.Provider value={{
            items,
            borrows,
            notifications,
            isLoaded,
            setCurrentUserId,
            addItem,
            updateItem,
            deleteItem,
            addBorrowRequest,
            updateBorrowStatus,
            notifyReturnBorrow,
            reportItemMaintenance,
            resolveItemMaintenance,
            addNotification,
            markNotificationRead,
            markAllNotificationsRead,
            clearAllNotifications
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

export default DataContext;
