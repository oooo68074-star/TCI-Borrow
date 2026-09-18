/**
 * Email Notification Service using EmailJS (Free, no backend needed)
 * 
 * Setup:
 *   1. Sign up at https://www.emailjs.com (free)
 *   2. Add Gmail service → get Service ID
 *   3. Create email templates → get Template IDs
 *   4. Get your Public Key from Account > API Keys
 *   5. Put all IDs in .env.local
 */

import emailjs from '@emailjs/browser';

// Initialize EmailJS with public key
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;

// Template IDs
const TEMPLATES = {
    BORROW_REQUEST: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_BORROW_REQUEST,
    BORROW_APPROVED: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_BORROW_APPROVED,
    BORROW_REJECTED: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_BORROW_REJECTED,
    BORROW_RETURNED: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_BORROW_RETURNED,
};

// Initialize once
let initialized = false;
function ensureInit() {
    if (!initialized && PUBLIC_KEY) {
        emailjs.init(PUBLIC_KEY);
        initialized = true;
    }
}

/**
 * Send email notification
 * @param {string} templateId - EmailJS template ID
 * @param {object} params - Template parameters
 */
async function sendEmail(templateId, params) {
    // Skip silently if EmailJS is not configured or still has placeholder values
    if (!PUBLIC_KEY || !SERVICE_ID || !templateId ||
        PUBLIC_KEY.includes('your_') || SERVICE_ID.includes('your_') || templateId.includes('your_')) {
        return null;
    }

    try {
        ensureInit();
        const result = await emailjs.send(SERVICE_ID, templateId, params);
        console.log('📧 Email sent successfully:', result.status);
        return result;
    } catch (error) {
        console.warn('⚠️ Failed to send email (check EmailJS config):', error);
        // Don't throw — email failure shouldn't break the app flow
        return null;
    }
}

// ============================================================
// Email notification functions
// ============================================================

/**
 * Notify admin about a new borrow request
 */
export async function notifyNewBorrowRequest({ adminEmail, borrowerName, borrowerEmail, itemName, quantity, reason, expectedReturnDays }) {
    return sendEmail(TEMPLATES.BORROW_REQUEST, {
        to_email: adminEmail,
        borrower_name: borrowerName,
        borrower_email: borrowerEmail || '-',
        item_name: itemName,
        quantity: quantity || 1,
        reason: reason || 'ไม่ระบุ',
        expected_days: expectedReturnDays ? `${expectedReturnDays} วัน` : 'ไม่ระบุ',
        app_url: 'https://tci-borrows-app.web.app/admin/borrows',
    });
}

/**
 * Notify borrower that their request was approved
 */
export async function notifyBorrowApproved({ borrowerEmail, borrowerName, itemName, dueDate }) {
    const formattedDate = dueDate
        ? new Date(dueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'ไม่ระบุ';

    return sendEmail(TEMPLATES.BORROW_APPROVED, {
        to_email: borrowerEmail,
        borrower_name: borrowerName,
        item_name: itemName,
        due_date: formattedDate,
        app_url: 'https://tci-borrows-app.web.app/my-borrows',
    });
}

/**
 * Notify borrower that their request was rejected
 */
export async function notifyBorrowRejected({ borrowerEmail, borrowerName, itemName }) {
    return sendEmail(TEMPLATES.BORROW_REJECTED, {
        to_email: borrowerEmail,
        borrower_name: borrowerName,
        item_name: itemName,
    });
}

/**
 * Notify borrower that their item was returned successfully
 */
export async function notifyBorrowReturned({ borrowerEmail, borrowerName, itemName }) {
    const returnDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    return sendEmail(TEMPLATES.BORROW_RETURNED, {
        to_email: borrowerEmail,
        borrower_name: borrowerName,
        item_name: itemName,
        return_date: returnDate,
    });
}
