import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';

const DB_NAME = 'motionpub_db';
const COLLECTION_NAME = 'contact_service_options';

export const DEFAULT_SERVICE_OPTIONS = [
  { name: 'Edit Video', order: 1, isDefault: true },
  { name: 'Video Production', order: 2, isDefault: false },
  { name: 'Reel', order: 3, isDefault: false }
];

/**
 * Access the contact_service_options collection in MongoDB
 */
export async function getServiceOptionCollection() {
  const db = await getDb(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

/**
 * Helper to build query supporting ObjectId and string fallback
 */
function buildIdQuery(id) {
  try {
    return { _id: new ObjectId(id) };
  } catch {
    return { _id: id };
  }
}

/**
 * Seed default options if the collection is currently empty
 */
export async function seedDefaultServiceOptionsIfEmpty() {
  const col = await getServiceOptionCollection();
  const count = await col.countDocuments();
  if (count === 0) {
    const now = new Date();
    const docs = DEFAULT_SERVICE_OPTIONS.map((item) => ({
      ...item,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }));
    await col.insertMany(docs);
    console.log('🌱 Seeded default contact service options in MongoDB');
  }
}

/**
 * Get all active service options sorted by order / creation date
 */
export async function getAllServiceOptions() {
  const col = await getServiceOptionCollection();
  await seedDefaultServiceOptionsIfEmpty();
  return col.find({ isActive: { $ne: false } }).sort({ order: 1, createdAt: 1 }).toArray();
}

/**
 * Get a single service option by ID
 */
export async function getServiceOptionById(id) {
  const col = await getServiceOptionCollection();
  const query = buildIdQuery(id);
  return col.findOne(query);
}

/**
 * Create a new service option
 * @param {Object} data - { name, order }
 */
export async function createServiceOption(data) {
  const col = await getServiceOptionCollection();
  const name = (data.name || '').trim();

  if (!name) {
    throw new Error('Service option name is required.');
  }

  // Check for duplicate name (case-insensitive)
  const existing = await col.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    isActive: { $ne: false }
  });

  if (existing) {
    throw new Error(`Service option "${name}" already exists.`);
  }

  // Determine highest order
  let order = Number(data.order);
  if (isNaN(order)) {
    const lastDoc = await col.find().sort({ order: -1 }).limit(1).toArray();
    order = (lastDoc.length > 0 && typeof lastDoc[0].order === 'number') ? lastDoc[0].order + 1 : 1;
  }

  const now = new Date();
  const doc = {
    name,
    order,
    isDefault: Boolean(data.isDefault),
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  const result = await col.insertOne(doc);
  return {
    _id: result.insertedId,
    ...doc
  };
}

/**
 * Update an existing service option by ID
 * @param {string} id
 * @param {Object} updateData - { name, order, isActive }
 */
export async function updateServiceOption(id, updateData) {
  const col = await getServiceOptionCollection();
  const query = buildIdQuery(id);

  const existing = await col.findOne(query);
  if (!existing) {
    throw new Error('Service option not found.');
  }

  const fieldsToSet = {
    updatedAt: new Date()
  };

  if (updateData.name !== undefined) {
    const trimmed = (updateData.name || '').trim();
    if (!trimmed) {
      throw new Error('Service option name cannot be empty.');
    }

    // Check if new name conflicts with another active option
    const duplicate = await col.findOne({
      _id: { $ne: existing._id },
      name: { $regex: new RegExp(`^${trimmed}$`, 'i') },
      isActive: { $ne: false }
    });
    if (duplicate) {
      throw new Error(`Another service option with the name "${trimmed}" already exists.`);
    }

    fieldsToSet.name = trimmed;
  }

  if (updateData.order !== undefined) {
    const numOrder = Number(updateData.order);
    if (!isNaN(numOrder)) {
      fieldsToSet.order = numOrder;
    }
  }

  if (updateData.isActive !== undefined) {
    fieldsToSet.isActive = Boolean(updateData.isActive);
  }

  if (updateData.isDefault !== undefined) {
    fieldsToSet.isDefault = Boolean(updateData.isDefault);
  }

  await col.updateOne(query, { $set: fieldsToSet });
  return col.findOne(query);
}

/**
 * Delete a service option by ID
 * @param {string} id
 */
export async function deleteServiceOption(id) {
  const col = await getServiceOptionCollection();
  const query = buildIdQuery(id);
  const result = await col.deleteOne(query);
  if (result.deletedCount === 0) {
    throw new Error('Service option not found or already deleted.');
  }
  return result;
}

/**
 * Reset service options to defaults
 */
export async function resetServiceOptionsToDefault() {
  const col = await getServiceOptionCollection();
  await col.deleteMany({});
  const now = new Date();
  const docs = DEFAULT_SERVICE_OPTIONS.map((item) => ({
    ...item,
    isActive: true,
    createdAt: now,
    updatedAt: now
  }));
  await col.insertMany(docs);
  return col.find({}).sort({ order: 1, createdAt: 1 }).toArray();
}
