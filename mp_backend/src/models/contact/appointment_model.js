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
 * Create a new appointment
 */
export async function createAppointment(data) {
  const newDoc = {
    clientName: (data.clientName || '').trim(),
    clientEmail: (data.clientEmail || '').trim().toLowerCase(),
    clientPhone: (data.clientPhone || '').trim(),
    serviceType: (data.serviceType || 'Edit Video').trim(),
    date: (data.date || '').trim(), // YYYY-MM-DD
    timeSlot: (data.timeSlot || '').trim(), // e.g. "10:00 AM"
    status: (data.status || 'confirmed').trim(), // 'confirmed' | 'pending' | 'completed' | 'cancelled'
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
    console.warn('⚠️ MongoDB unavailable, saving appointment in memory:', err.message);
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
  if (updateData.date !== undefined) fieldsToSet.date = updateData.date.trim();
  if (updateData.timeSlot !== undefined) fieldsToSet.timeSlot = updateData.timeSlot.trim();
  if (updateData.status !== undefined) fieldsToSet.status = updateData.status.trim();
  if (updateData.notes !== undefined) fieldsToSet.notes = updateData.notes.trim();

  try {
    const col = await getAppointmentsCollection();
    const query = buildIdQuery(id);
    await col.updateOne(query, { $set: fieldsToSet });
    return await col.findOne(query);
  } catch (err) {
    console.warn('⚠️ MongoDB unavailable, updating appointment in memory:', err.message);
    const index = inMemoryAppointments.findIndex((item) => String(item._id) === String(id));
    if (index !== -1) {
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
