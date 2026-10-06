import { Router } from 'express';
import {
  saveContactMessage,
  getAllContactMessages,
  markMessageRead,
  markAllMessagesRead,
  deleteContactMessage
} from '../../models/contact/contact_model.js';

const router = Router();

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * POST /api/contact
 * Handles contact form submissions and saves them to MongoDB
 */
router.post('/', async (req, res) => {
  try {
    const { name, firstName, lastName, email, phone, message } = req.body;

    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message.'
      });
    }

    // Extract local 9 digits (handles rawPhone or phone with country code e.g. "+94 767385049")
    let rawDigits = (req.body.rawPhone || phone || '').replace(/\D/g, '');

    // Strip leading 0 if 10 digits (e.g. 0771234567 -> 771234567)
    if (rawDigits.length === 10 && rawDigits.startsWith('0')) {
      rawDigits = rawDigits.slice(1);
    }

    // If country code is attached at the start (e.g. 94 + 9 digits = 11 digits), take last 9 digits
    let localDigits = rawDigits;
    if (rawDigits.length > 9) {
      localDigits = rawDigits.slice(-9);
    }

    if (!localDigits || localDigits.length !== 9) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must contain exactly 9 digits.'
      });
    }

    const cCode = req.body.countryCode || '+94';
    const formattedPhone = `${cCode} ${localDigits}`;

    const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim();

    const savedDoc = await saveContactMessage({
      name: fullName,
      firstName,
      lastName,
      email,
      phone: formattedPhone,
      message
    });

    console.log(`📩 New message saved [ID: ${savedDoc._id}] from ${savedDoc.name || savedDoc.email}`);

    return res.status(201).json({
      success: true,
      message: 'your message sent  we will contact you soon',
      data: {
        id: savedDoc._id,
        createdAt: savedDoc.createdAt
      }
    });
  } catch (err) {
    console.error('❌ Error saving contact message to MongoDB:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to save message. Please try again later.'
    });
  }
});

/**
 * GET /api/contact/messages
 * Retrieves submitted messages (for administration)
 */
router.get('/messages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const messages = await getAllContactMessages(limit);

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    console.error('❌ Error fetching contact messages:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages.'
    });
  }
});

/**
 * PATCH /api/contact/messages/read-all
 * Mark all messages as read
 */
router.patch('/messages/read-all', async (req, res) => {
  try {
    await markAllMessagesRead();
    return res.status(200).json({
      success: true,
      message: 'All messages marked as read.'
    });
  } catch (err) {
    console.error('❌ Error marking all messages read:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all messages as read.'
    });
  }
});

/**
 * PATCH /api/contact/messages/:id/read
 * Mark a message as read or unread
 */
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const isRead = req.body.read !== undefined ? req.body.read : true;
    await markMessageRead(id, isRead);
    return res.status(200).json({
      success: true,
      message: `Message marked as ${isRead ? 'read' : 'unread'}.`
    });
  } catch (err) {
    console.error('❌ Error updating message read status:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update message status.'
    });
  }
});

/**
 * DELETE /api/contact/messages/:id
 * Delete a single message
 */
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteContactMessage(id);
    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully.'
    });
  } catch (err) {
    console.error('❌ Error deleting message:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete message.'
    });
  }
});

export default router;

