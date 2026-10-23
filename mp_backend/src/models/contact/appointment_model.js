import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';

const DB_NAME = 'motionpub_db';
const COLLECTION_NAME = 'contact_appointments';

// In-memory fallback if MongoDB Atlas is disconnected or not configured
let inMemoryAppointments = [
  {
    _id: 'sample-appt-1',
    clientName: 'Alex Mercer',
    clientEmail: 'alex@example.com',
    clientPhone: '+94 77 123 4567',
    serviceType: 'Edit Video',
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), // 2 days from now
    timeSlot: '11:00 AM',
    status: 'confirmed',
    notes: 'Discussion about motion graphics reel intro',
    source: 'client',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'sample-appt-2',
    clientName: 'Samantha Green',
    clientEmail: 'samantha@studiogreen.io',
    clientPhone: '+1 415 555 2671',
    serviceType: 'Video Production',
    date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), // 5 days from now
    timeSlot: '03:00 PM',
    status: 'pending',
    notes: 'Commercial teaser editing schedule',
    source: 'client',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let indexesCreated = false;

/**
 * Initialize MongoDB unique partial index and auxiliary indexes for appointments
 */
export async function initAppointmentIndexes() {
  if (indexesCreated) return;
  try {
    const col = await getAppointmentsCollection();

    // Drop legacy index if its specification didn't use isActive: true
    try {
      const existingIndexes = await col.indexes();
      const faulty = existingIndexes.find((i) => i.name === 'unique_active_date_timeslot');
      if (faulty && !faulty.partialFilterExpression?.isActive) {
        await col.dropIndex('unique_active_date_timeslot');
      }
    } catch {}

    // Backfill legacy documents missing isActive field
    await col.updateMany(
      { isActive: { $exists: false } },
      [{ $set: { isActive: { $ne: ['$status', 'cancelled'] } } }]
    ).catch(() => {});

    // 1. Unique partial index: Only one active appointment per date & timeSlot
    await col.createIndex(
      { date: 1, timeSlot: 1 },
      {
        unique: true,
        partialFilterExpression: { isActive: true },
        name: 'unique_active_date_timeslot'
      }
    );

    // 2. Deduplicate any existing active appointments per email before creating unique index
    const activeAppts = await col.find({ isActive: true }).toArray();
    const emailGroups = {};
    for (const a of activeAppts) {
      const email = (a.clientEmail || '').trim().toLowerCase();
      if (!email) continue;
      if (!emailGroups[email]) emailGroups[email] = [];
      emailGroups[email].push(a);
    }

    for (const [email, group] of Object.entries(emailGroups)) {
      if (group.length > 1) {
        // Sort by date / createdAt descending, keep the latest one active
        group.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        const [latest, ...older] = group;
        for (const old of older) {
          await col.updateOne(
            { _id: old._id },
            { $set: { status: 'cancelled', isActive: false } }
          );
        }
        console.log(`ℹ️ Cleaned up duplicate active test bookings for ${email}. Kept latest active on ${latest.date} at ${latest.timeSlot}.`);
      }
    }

    // 3. Unique partial index: Only ONE active appointment per client email address!
    await col.createIndex(
      { clientEmail: 1 },
      {
        unique: true,
        partialFilterExpression: { isActive: true },
        name: 'unique_active_client_email'
      }
    );

    indexesCreated = true;
    console.log('✅ Appointment indexes verified (unique_active_date_timeslot & unique_active_client_email).');
  } catch (err) {
    console.warn('⚠️ Could not initialize appointment indexes:', err.message);
  }
}

export async function getAppointmentsCollection() {
  const db = await getDb(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

function buildIdQuery(id) {
  try {
    return { _id: new ObjectId(id) };
  } catch {
    return { _id: id };
  }
}

/**
 * Fast O(1) indexed lookup for an active appointment at a specific date and time slot
 * @param {string} date
 * @param {string} timeSlot
 * @param {string|ObjectId} [excludeId] - Optional appointment ID to exclude (for updates)
 */
export async function findActiveAppointmentBySlot(date, timeSlot, excludeId = null) {
  const cleanDate = (date || '').trim();
  const cleanSlot = (timeSlot || '').trim();

  try {
    const col = await getAppointmentsCollection();
    const query = {
      date: cleanDate,
      timeSlot: cleanSlot,
      $or: [
        { isActive: true },
        { status: { $ne: 'cancelled' } }
      ]
    };
    if (excludeId) {
      const idQuery = buildIdQuery(excludeId);
      query._id = { $ne: idQuery._id };
    }
    return await col.findOne(query);
  } catch {
    // In-memory fallback
    return inMemoryAppointments.find((a) => {
      if (excludeId && String(a._id) === String(excludeId)) return false;
      return a.date === cleanDate &&
             a.timeSlot === cleanSlot &&
             a.status !== 'cancelled';
    }) || null;
  }
}

/**
 * Fast lookup for an active appointment for a specific client email
 * Ensures a single user cannot book multiple active meetings at once
 * @param {string} clientEmail
 * @param {string|ObjectId} [excludeId]
 */
export async function findActiveAppointmentByUser(clientEmail, excludeId = null) {
  const cleanEmail = (clientEmail || '').trim().toLowerCase();
  if (!cleanEmail) return null;

  try {
    const col = await getAppointmentsCollection();
    const query = {
      clientEmail: cleanEmail,
      $or: [
        { isActive: true },
        { status: { $in: ['confirmed', 'pending'] } }
      ]
    };
    if (excludeId) {
      const idQuery = buildIdQuery(excludeId);
      query._id = { $ne: idQuery._id };
    }
    return await col.findOne(query);
  } catch {
    return inMemoryAppointments.find((a) => {
      if (excludeId && String(a._id) === String(excludeId)) return false;
      return (a.clientEmail || '').toLowerCase() === cleanEmail &&
             a.status !== 'cancelled' &&
             a.status !== 'completed';
    }) || null;
  }
}

/**
 * Fast lookup for all active appointments for a specific user email
 * @param {string} clientEmail
 */
export async function findActiveAppointmentsByUser(clientEmail) {
  const cleanEmail = (clientEmail || '').trim().toLowerCase();
  try {
    const col = await getAppointmentsCollection();
    return await col.find({
      clientEmail: cleanEmail,
      status: { $ne: 'cancelled' }
    }).toArray();
  } catch {
    return inMemoryAppointments.filter((a) =>
      a.clientEmail?.toLowerCase() === cleanEmail && a.status !== 'cancelled'
    );
  }
}

/**
 * Get all appointments sorted by date ascending then time
 */
export async function getAllAppointments() {
  try {
    const col = await getAppointmentsCollection();
    const appts = await col.find({}).sort({ date: 1, timeSlot: 1 }).toArray();
    return appts;
  } catch (err) {
    console.warn('⚠️ MongoDB unavailable for appointments, using in-memory store:', err.message);
    return [...inMemoryAppointments].sort((a, b) => (a.date > b.date ? 1 : -1));
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id) {
  try {
    const col = await getAppointmentsCollection();
    const query = buildIdQuery(id);
    return await col.findOne(query);
  } catch (err) {
    return inMemoryAppointments.find((item) => String(item._id) === String(id)) || null;
  }
}

/**
 * Create a new appointment with concurrency-safe collision checks
 */
export async function createAppointment(data) {
  const status = (data.status || 'pending').trim();
  const isActive = status !== 'cancelled' && status !== 'completed';

  const newDoc = {
    clientName: (data.clientName || '').trim(),
    clientEmail: (data.clientEmail || '').trim().toLowerCase(),
    clientPhone: (data.clientPhone || '').trim(),
    serviceType: (data.serviceType || 'Edit Video').trim(),
    meetingMethod: (data.meetingMethod || 'Google Meet').trim(),
    date: (data.date || '').trim(), // YYYY-MM-DD
    timeSlot: (data.timeSlot || '').trim(), // e.g. "10:00 AM"
    status, // 'confirmed' | 'pending' | 'completed' | 'cancelled'
    isActive, // boolean flag for partial unique index
    notes: (data.notes || '').trim(),
    source: data.source || 'client', // 'client' | 'admin'
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const col = await getAppointmentsCollection();
    const result = await col.insertOne(newDoc);
    return {
      _id: result.insertedId,
      ...newDoc
    };
  } catch (err) {
    // Propagate MongoDB duplicate key error (code 11000) directly for 409 handling
    if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
      const isEmailConflict = (err.keyPattern && err.keyPattern.clientEmail) ||
                              (err.message && err.message.includes('unique_active_client_email')) ||
                              (err.message && err.message.includes('clientEmail'));
      const dupError = new Error(
        isEmailConflict
          ? `User already has an active appointment: ${newDoc.clientEmail}`
          : `Slot collision: ${newDoc.date} at ${newDoc.timeSlot} is already booked.`
      );
      dupError.code = 11000;
      dupError.keyPattern = err.keyPattern;
      dupError.conflictType = isEmailConflict ? 'EMAIL_COLLISION' : 'SLOT_COLLISION';
      throw dupError;
    }

    console.warn('⚠️ MongoDB unavailable, saving appointment in memory:', err.message);

    // In-memory atomic uniqueness checks
    if (newDoc.isActive) {
      // 1. Email check: One user = One active booking
      const emailConflict = inMemoryAppointments.find((a) =>
        (a.clientEmail || '').toLowerCase() === newDoc.clientEmail &&
        a.status !== 'cancelled' &&
        a.status !== 'completed'
      );
      if (emailConflict) {
        const memEmailErr = new Error(`User already has an active appointment: ${newDoc.clientEmail}`);
        memEmailErr.code = 11000;
        memEmailErr.conflictType = 'EMAIL_COLLISION';
        throw memEmailErr;
      }

      // 2. Slot check: One appointment per date and slot
      const slotConflict = inMemoryAppointments.find((a) =>
        a.date === newDoc.date &&
        a.timeSlot === newDoc.timeSlot &&
        a.status !== 'cancelled'
      );
      if (slotConflict) {
        const memDupError = new Error(`Slot collision: ${newDoc.date} at ${newDoc.timeSlot} is already booked.`);
        memDupError.code = 11000;
        memDupError.conflictType = 'SLOT_COLLISION';
        throw memDupError;
      }
    }

    const inMemDoc = {
      _id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...newDoc
    };
    inMemoryAppointments.unshift(inMemDoc);
    return inMemDoc;
  }
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(id, updateData) {
  const fieldsToSet = {
    updatedAt: new Date()
  };

  if (updateData.clientName !== undefined) fieldsToSet.clientName = updateData.clientName.trim();
  if (updateData.clientEmail !== undefined) fieldsToSet.clientEmail = updateData.clientEmail.trim().toLowerCase();
  if (updateData.clientPhone !== undefined) fieldsToSet.clientPhone = updateData.clientPhone.trim();
  if (updateData.serviceType !== undefined) fieldsToSet.serviceType = updateData.serviceType.trim();
  if (updateData.meetingMethod !== undefined) fieldsToSet.meetingMethod = updateData.meetingMethod.trim();
  if (updateData.date !== undefined) fieldsToSet.date = updateData.date.trim();
  if (updateData.timeSlot !== undefined) fieldsToSet.timeSlot = updateData.timeSlot.trim();
  if (updateData.status !== undefined) {
    const cleanStatus = updateData.status.trim();
    fieldsToSet.status = cleanStatus;
    fieldsToSet.isActive = cleanStatus !== 'cancelled' && cleanStatus !== 'completed';
  }
  if (updateData.notes !== undefined) fieldsToSet.notes = updateData.notes.trim();

  try {
    const col = await getAppointmentsCollection();
    const query = buildIdQuery(id);
    await col.updateOne(query, { $set: fieldsToSet });
    return await col.findOne(query);
  } catch (err) {
    if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
      const isEmailConflict = (err.keyPattern && err.keyPattern.clientEmail) ||
                              (err.message && err.message.includes('unique_active_client_email')) ||
                              (err.message && err.message.includes('clientEmail'));
      const dupError = new Error(
        isEmailConflict
          ? 'Client already has another active appointment under this email.'
          : 'Slot collision: this date and time slot is already booked by another appointment.'
      );
      dupError.code = 11000;
      dupError.conflictType = isEmailConflict ? 'EMAIL_COLLISION' : 'SLOT_COLLISION';
      throw dupError;
    }

    console.warn('⚠️ MongoDB unavailable, updating appointment in memory:', err.message);
    const index = inMemoryAppointments.findIndex((item) => String(item._id) === String(id));
    if (index !== -1) {
      // In-memory conflict check if date, timeSlot, or email changed
      const targetEmail = (fieldsToSet.clientEmail || inMemoryAppointments[index].clientEmail || '').toLowerCase();
      const targetDate = fieldsToSet.date || inMemoryAppointments[index].date;
      const targetSlot = fieldsToSet.timeSlot || inMemoryAppointments[index].timeSlot;
      const targetStatus = fieldsToSet.status || inMemoryAppointments[index].status;

      if (targetStatus !== 'cancelled' && targetStatus !== 'completed') {
        // Email conflict check
        const emailConflict = inMemoryAppointments.find((a) =>
          String(a._id) !== String(id) &&
          (a.clientEmail || '').toLowerCase() === targetEmail &&
          a.status !== 'cancelled' &&
          a.status !== 'completed'
        );
        if (emailConflict) {
          const memErr = new Error(`Client already has another active appointment: ${targetEmail}`);
          memErr.code = 11000;
          memErr.conflictType = 'EMAIL_COLLISION';
          throw memErr;
        }

        // Slot conflict check
        const slotConflict = inMemoryAppointments.find((a) =>
          String(a._id) !== String(id) &&
          a.date === targetDate &&
          a.timeSlot === targetSlot &&
          a.status !== 'cancelled'
        );
        if (slotConflict) {
          const memDupError = new Error(`Slot collision: this date and time slot is already booked.`);
          memDupError.code = 11000;
          memDupError.conflictType = 'SLOT_COLLISION';
          throw memDupError;
        }
      }

      inMemoryAppointments[index] = {
        ...inMemoryAppointments[index],
        ...fieldsToSet
      };
      return inMemoryAppointments[index];
    }
    throw new Error('Appointment not found in memory store');
  }
}

/**
 * Delete an appointment by ID
 */
export async function deleteAppointment(id) {
  try {
    const col = await getAppointmentsCollection();
    const query = buildIdQuery(id);
    const res = await col.deleteOne(query);
    return res;
  } catch (err) {
    console.warn('⚠️ MongoDB unavailable, deleting appointment from memory:', err.message);
    const initialLen = inMemoryAppointments.length;
    inMemoryAppointments = inMemoryAppointments.filter((item) => String(item._id) !== String(id));
    return { deletedCount: initialLen - inMemoryAppointments.length };
  }
}
