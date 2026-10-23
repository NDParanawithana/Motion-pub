import { Router } from 'express';
import {
  saveContactMessage,
  getAllContactMessages,
  markMessageRead,
  markAllMessagesRead,
  deleteContactMessage
} from '../../models/contact/contact_model.js';
import {
  getAllServiceOptions,
  createServiceOption,
  updateServiceOption,
  deleteServiceOption,
  resetServiceOptionsToDefault
} from '../../models/contact/service_option_model.js';
import {
  getAllAppointments,
  findActiveAppointmentBySlot,
  findActiveAppointmentByUser,
  findActiveAppointmentsByUser,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from '../../models/contact/appointment_model.js';

const router = Router();

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * =========================================================================
 * Service Options Endpoints (Dropdown options: Edit Video, Video Production, Reel)
 * =========================================================================
 */

/**
 * GET /api/contact/services
 * Get all available service dropdown options
 */
router.get('/services', async (req, res) => {
  try {
    const services = await getAllServiceOptions();
    return res.status(200).json({
      success: true,
      data: services
    });
  } catch (err) {
    console.error('❌ Error fetching service options:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch service options.'
    });
  }
});

/**
 * POST /api/contact/services
 * Add a new service option to the dropdown
 */
router.post('/services', async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Service option name is required.'
      });
    }

    const newOption = await createServiceOption({ name, order });
    return res.status(201).json({
      success: true,
      message: 'Service option added successfully.',
      data: newOption
    });
  } catch (err) {
    console.error('❌ Error creating service option:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to create service option.'
    });
  }
});

/**
 * PUT /api/contact/services/:id
 * Edit an existing service option
 */
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order, isActive } = req.body;

    const updated = await updateServiceOption(id, { name, order, isActive });
    return res.status(200).json({
      success: true,
      message: 'Service option updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('❌ Error updating service option:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to update service option.'
    });
  }
});

/**
 * PATCH /api/contact/services/:id
 * Partial update for service option
 */
router.patch('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order, isActive } = req.body;

    const updated = await updateServiceOption(id, { name, order, isActive });
    return res.status(200).json({
      success: true,
      message: 'Service option updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('❌ Error updating service option:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to update service option.'
    });
  }
});

/**
 * DELETE /api/contact/services/:id
 * Delete a service option from the dropdown
 */
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteServiceOption(id);
    return res.status(200).json({
      success: true,
      message: 'Service option deleted successfully.'
    });
  } catch (err) {
    console.error('❌ Error deleting service option:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to delete service option.'
    });
  }
});

/**
 * POST /api/contact/services/reset
 * Reset service options back to default: Edit Video, Video Production, Reel
 */
router.post('/services/reset', async (req, res) => {
  try {
    const defaults = await resetServiceOptionsToDefault();
    return res.status(200).json({
      success: true,
      message: 'Service options reset to defaults successfully.',
      data: defaults
    });
  } catch (err) {
    console.error('❌ Error resetting service options:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset service options.'
    });
  }
});

/**
 * POST /api/contact
 * Handles contact form submissions and saves them to MongoDB
 */
router.post('/', async (req, res) => {
  try {
    const { name, firstName, lastName, email, phone, message, serviceType } = req.body;

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
      serviceType: (serviceType || '').trim(),
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
/**
 * =========================================================================
 * Client Meeting Appointments Endpoints
 * =========================================================================
 */

/**
 * GET /api/contact/appointments
 * Fetch all booked appointments
 */
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await getAllAppointments();
    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    console.error('❌ Error fetching appointments:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments.'
    });
  }
});

/**
 * POST /api/contact/appointments
 * Book a new appointment (client booking or admin manual entry)
 */
router.post('/appointments', async (req, res) => {
  try {
    const { clientName, clientEmail, clientPhone, serviceType, meetingMethod, date, timeSlot, notes, source, status } = req.body;

    if (!clientName || !clientName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Client name is required.'
      });
    }

    if (!clientEmail || !EMAIL_REGEX.test(clientEmail.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid client email address is required.'
      });
    }

    if (!date || !date.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date is required.'
      });
    }

    if (!timeSlot || !timeSlot.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment time slot is required.'
      });
    }

    // 1. One user = One active appointment check (prevent same email from hoarding multiple bookings)
    const existingUserBooking = await findActiveAppointmentByUser(clientEmail.trim().toLowerCase());
    if (existingUserBooking) {
      return res.status(409).json({
        success: false,
        code: 'USER_ALREADY_HAS_APPOINTMENT',
        message: `You already have an active appointment scheduled for ${existingUserBooking.date} at ${existingUserBooking.timeSlot}. Each client is allowed only one active appointment at a time. Please reschedule or contact us if you need to change your meeting.`,
        existingAppointment: {
          id: existingUserBooking._id,
          date: existingUserBooking.date,
          timeSlot: existingUserBooking.timeSlot
        }
      });
    }

    // 2. Slot availability check: Is this specific date & time slot already taken?
    const existingSlot = await findActiveAppointmentBySlot(date.trim(), timeSlot.trim());
    if (existingSlot) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_ALREADY_TAKEN',
        message: `The slot on ${date.trim()} at ${timeSlot.trim()} has just been booked. Please choose another available slot.`
      });
    }

    // 3. Attempt atomic creation and catch race condition (E11000 duplicate key error)
    let created;
    try {
      created = await createAppointment({
        clientName,
        clientEmail,
        clientPhone,
        serviceType,
        meetingMethod: meetingMethod || 'Google Meet',
        date,
        timeSlot,
        notes,
        source: source || 'client',
        status: status || 'pending'
      });
    } catch (err) {
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        const isEmailConflict = err.conflictType === 'EMAIL_COLLISION' ||
                                (err.keyPattern && err.keyPattern.clientEmail) ||
                                (err.message && err.message.includes('unique_active_client_email')) ||
                                (err.message && err.message.includes('clientEmail'));
        if (isEmailConflict) {
          return res.status(409).json({
            success: false,
            code: 'USER_ALREADY_HAS_APPOINTMENT',
            message: `You already have an active appointment under ${clientEmail.trim()}. Each client is allowed only one active appointment at a time.`
          });
        }
        return res.status(409).json({
          success: false,
          code: 'SLOT_ALREADY_TAKEN',
          message: `The date ${date.trim()} at ${timeSlot.trim()} was just reserved by another client a moment ago. Please select an alternative slot.`
        });
      }
      throw err;
    }

    console.log(`📅 New appointment booked [ID: ${created._id}] for ${created.clientName} on ${created.date} at ${created.timeSlot} via ${created.meetingMethod}`);

    return res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully!',
      data: created
    });
  } catch (err) {
    console.error('❌ Error creating appointment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment.'
    });
  }
});

/**
 * PUT /api/contact/appointments/:id
 * Full update for an appointment (admin edit)
 */
router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, clientEmail, clientPhone, serviceType, meetingMethod, date, timeSlot, notes, status } = req.body;

    // Check if clientEmail already has another active appointment if email or status updated
    if (clientEmail) {
      const emailConflict = await findActiveAppointmentByUser(clientEmail.trim().toLowerCase(), id);
      if (emailConflict && (status === undefined || (status !== 'cancelled' && status !== 'completed'))) {
        return res.status(409).json({
          success: false,
          code: 'USER_ALREADY_HAS_APPOINTMENT',
          message: `Client ${clientEmail} already has another active appointment on ${emailConflict.date} at ${emailConflict.timeSlot}.`
        });
      }
    }

    // Check conflict with other appointments if date/time changed
    if (date && timeSlot) {
      const conflict = await findActiveAppointmentBySlot(date.trim(), timeSlot.trim(), id);
      if (conflict) {
        return res.status(409).json({
          success: false,
          code: 'SLOT_ALREADY_TAKEN',
          message: `The slot on ${date} at ${timeSlot} is already booked by another appointment.`
        });
      }
    }

    let updated;
    try {
      updated = await updateAppointment(id, {
        clientName,
        clientEmail,
        clientPhone,
        serviceType,
        meetingMethod,
        date,
        timeSlot,
        notes,
        status
      });
    } catch (err) {
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        const isEmailConflict = err.conflictType === 'EMAIL_COLLISION' ||
                                (err.keyPattern && err.keyPattern.clientEmail) ||
                                (err.message && err.message.includes('unique_active_client_email')) ||
                                (err.message && err.message.includes('clientEmail'));
        if (isEmailConflict) {
          return res.status(409).json({
            success: false,
            code: 'USER_ALREADY_HAS_APPOINTMENT',
            message: `Client already has another active appointment under this email.`
          });
        }
        return res.status(409).json({
          success: false,
          code: 'SLOT_ALREADY_TAKEN',
          message: `The slot on ${date} at ${timeSlot} is already booked by another appointment.`
        });
      }
      throw err;
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('❌ Error updating appointment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment.'
    });
  }
});

/**
 * PATCH /api/contact/appointments/:id
 * Partial update for appointment (e.g. quick status update)
 */
router.patch('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateAppointment(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully.',
      data: updated
    });
  } catch (err) {
    if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_ALREADY_TAKEN',
        message: 'The slot is already booked by another active appointment.'
      });
    }
    console.error('❌ Error patching appointment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment.'
    });
  }
});

/**
 * DELETE /api/contact/appointments/:id
 * Cancel / Delete an appointment
 */
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteAppointment(id);
    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully.'
    });
  } catch (err) {
    console.error('❌ Error deleting appointment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete appointment.'
    });
  }
});

export default router;

