import { getDb } from '../../config/db.js';

const DB_NAME = 'motionpub_db';

/**
 * Access the admin collection in motionpub_db
 * Automatically supports 'site_admins', 'site_admin', or 'admins'
 */
export async function getAdminCollection() {
  const db = await getDb(DB_NAME);
  try {
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);

    if (names.includes('site_admins')) {
      return db.collection('site_admins');
    }
    if (names.includes('site_admin')) {
      return db.collection('site_admin');
    }
    if (names.includes('admins')) {
      return db.collection('admins');
    }
  } catch (err) {
    console.warn('Collection list fallback:', err.message);
  }

  // Default fallback
  return db.collection('site_admins');
}

/**
 * Find an admin document by username (case-insensitive)
 * @param {string} username
 * @returns {Promise<object|null>}
 */
export async function findAdminByUsername(username) {
  if (!username) return null;
  const collection = await getAdminCollection();
  
  // Clean string and escape regex special characters
  const cleanUsername = username.trim();
  const escaped = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return await collection.findOne({
    username: { $regex: new RegExp(`^${escaped}$`, 'i') }
  });
}

/**
 * Compare entered password with stored password.
 * Trims extraneous trailing/leading spaces.
 * @param {string} inputPassword
 * @param {string} storedPassword
 * @returns {boolean}
 */
export function verifyAdminPassword(inputPassword, storedPassword) {
  if (!inputPassword || !storedPassword) return false;
  return inputPassword.trim() === storedPassword.trim();
}

/**
 * Sanitize admin document before sending in HTTP response
 * @param {object} adminDoc
 * @returns {object}
 */
export function sanitizeAdmin(adminDoc) {
  if (!adminDoc) return null;
  return {
    id: adminDoc._id,
    username: adminDoc.username,
    name: adminDoc.name || 'Admin',
    role: adminDoc.role || 'admin'
  };
}
