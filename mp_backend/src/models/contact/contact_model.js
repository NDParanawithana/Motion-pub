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
