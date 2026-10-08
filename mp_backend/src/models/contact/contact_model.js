import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';

const DB_NAME = 'motionpub_db';
const COLLECTION_NAME = 'contact_messages';

/**
 * Access the contact_messages collection in MongoDB
 */
export async function getContactCollection() {
  const db = await getDb(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

/**
 * Helper to create an _id query supporting both ObjectId and string fallback
 */
function buildIdQuery(id) {
  try {
    return { _id: new ObjectId(id) };
  } catch {
    return { _id: id };
  }
}

/**
 * Save a new contact form submission to MongoDB
 * @param {Object} messageData
 */
export async function saveContactMessage(messageData) {
  const col = await getContactCollection();

  const doc = {
    name: (messageData.name || '').trim(),
    firstName: (messageData.firstName || '').trim(),
    lastName: (messageData.lastName || '').trim(),
    email: (messageData.email || '').trim().toLowerCase(),
    phone: (messageData.phone || '').trim(),
    serviceType: (messageData.serviceType || '').trim(),
    message: (messageData.message || '').trim(),
    status: 'unread',
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await col.insertOne(doc);
  return {
    _id: result.insertedId,
    ...doc
  };
}

/**
 * Get all contact messages sorted by newest first
 * @param {number} limit
 */
export async function getAllContactMessages(limit = 100) {
  const col = await getContactCollection();
  return col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
}

/**
 * Mark a specific message as read or unread
 * @param {string} id
 * @param {boolean} isRead
 */
export async function markMessageRead(id, isRead = true) {
  const col = await getContactCollection();
  const query = buildIdQuery(id);
  const result = await col.updateOne(
    query,
    {
      $set: {
        read: Boolean(isRead),
        status: isRead ? 'read' : 'unread',
        updatedAt: new Date()
      }
    }
  );
  return result;
}

/**
 * Mark all messages as read
 */
export async function markAllMessagesRead() {
  const col = await getContactCollection();
  const result = await col.updateMany(
    {},
    {
      $set: {
        read: true,
        status: 'read',
        updatedAt: new Date()
      }
    }
  );
  return result;
}

/**
 * Delete a message by id
 * @param {string} id
 */
export async function deleteContactMessage(id) {
  const col = await getContactCollection();
  const query = buildIdQuery(id);
  const result = await col.deleteOne(query);
  return result;
}

