import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';

const DB_NAME = 'motionpub_db';
const COLLECTION_NAME = 'team_members';

export const DEFAULT_TEAM_MEMBERS = [
  {
    name: 'Leo Martin',
    role: 'Lead Video Editor',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80',
    imagePublicId: null,
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: ''
    },
    order: 0
  },
  {
    name: 'Minh Nguyen',
    role: 'Motion Designer',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=640&q=80',
    imagePublicId: null,
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: ''
    },
    order: 1
  },
  {
    name: 'Taylor Jones',
    role: 'Founder of Motion Pub',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80',
    imagePublicId: null,
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: ''
    },
    order: 2
  },
  {
    name: 'Aisha Rahman',
    role: 'Creative Director',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=640&q=80',
    imagePublicId: null,
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: ''
    },
    order: 3
  },
  {
    name: 'Arjun Lim',
    role: 'Cinematographer & Colorist',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=640&q=80',
    imagePublicId: null,
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: ''
    },
    order: 4
  }
];

const sanitizeSocials = (socials = {}) => ({
  facebook: typeof socials.facebook === 'string' ? socials.facebook.trim() : '',
  linkedin: typeof socials.linkedin === 'string' ? socials.linkedin.trim() : '',
  x: typeof socials.x === 'string' ? socials.x.trim() : '',
  instagram: typeof socials.instagram === 'string' ? socials.instagram.trim() : ''
});

const serializeMember = (doc) => ({
  id: doc._id.toString(),
  _id: doc._id.toString(),
  name: doc.name || '',
  role: doc.role || '',
  image: doc.image || '',
  imagePublicId: doc.imagePublicId || null,
  socials: sanitizeSocials(doc.socials),
  order: typeof doc.order === 'number' ? doc.order : 0,
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null
});

export async function getTeamCollection() {
  const db = await getDb(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

/**
 * Retrieve all team members sorted by order.
 * Seeds default team members once if the collection has never been initialized.
 */
export async function getAllTeamMembers() {
  const db = await getDb(DB_NAME);
  const col = db.collection(COLLECTION_NAME);
  const metaCol = db.collection('site_content');

  const count = await col.countDocuments();
  if (count === 0) {
    const meta = await metaCol.findOne({ section: 'team_meta' });
    if (!meta?.seeded) {
      const now = new Date();
      const docs = DEFAULT_TEAM_MEMBERS.map((m) => ({
        ...m,
        createdAt: now,
        updatedAt: now
      }));
      await col.insertMany(docs);
      await metaCol.updateOne(
        { section: 'team_meta' },
        { $set: { section: 'team_meta', seeded: true, updatedAt: now } },
        { upsert: true }
      );
    }
  }

  const list = await col
    .find({})
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  return list.map(serializeMember);
}

/**
 * Create a new team member
 */
export async function createTeamMember(payload) {
  const col = await getTeamCollection();
  const count = await col.countDocuments();
  const now = new Date();

  const doc = {
    name: (payload.name || '').trim(),
    role: (payload.role || '').trim(),
    image: typeof payload.image === 'string' ? payload.image.trim() : '',
    imagePublicId: payload.imagePublicId || null,
    socials: sanitizeSocials(payload.socials),
    order: typeof payload.order === 'number' ? payload.order : count,
    createdAt: now,
    updatedAt: now
  };

  const result = await col.insertOne(doc);
  return serializeMember({ ...doc, _id: result.insertedId });
}

/**
 * Update an existing team member by ID
 */
export async function updateTeamMember(id, payload) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid team member ID.');
  }

  const col = await getTeamCollection();
  const objectId = new ObjectId(id);
  const existing = await col.findOne({ _id: objectId });

  if (!existing) {
    throw new Error('Team member not found.');
  }

  const updateFields = {
    updatedAt: new Date()
  };

  if (payload.name !== undefined) {
    updateFields.name = String(payload.name).trim();
  }
  if (payload.role !== undefined) {
    updateFields.role = String(payload.role).trim();
  }
  if (payload.image !== undefined) {
    updateFields.image = typeof payload.image === 'string' ? payload.image.trim() : '';
  }
  if (payload.imagePublicId !== undefined) {
    updateFields.imagePublicId = payload.imagePublicId || null;
  }
  if (payload.socials !== undefined) {
    updateFields.socials = sanitizeSocials(payload.socials);
  }
  if (typeof payload.order === 'number') {
    updateFields.order = payload.order;
  }

  await col.updateOne({ _id: objectId }, { $set: updateFields });
  const updatedDoc = await col.findOne({ _id: objectId });

  const previousImagePublicId =
    existing.imagePublicId &&
    updateFields.imagePublicId !== undefined &&
    existing.imagePublicId !== updateFields.imagePublicId
      ? existing.imagePublicId
      : null;

  return {
    member: serializeMember(updatedDoc),
    previousImagePublicId
  };
}

/**
 * Delete a team member by ID
 */
export async function deleteTeamMember(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid team member ID.');
  }

  const col = await getTeamCollection();
  const objectId = new ObjectId(id);
  const existing = await col.findOne({ _id: objectId });

  if (!existing) {
    throw new Error('Team member not found.');
  }

  await col.deleteOne({ _id: objectId });

  return {
    deletedId: id,
    previousImagePublicId: existing.imagePublicId || null
  };
}

/**
 * Persist a new display order for team members
 */
export async function reorderTeamMembers(orderedIds) {
  const col = await getTeamCollection();
  const ops = orderedIds
    .filter((id) => ObjectId.isValid(id))
    .map((id, index) => ({
      updateOne: {
        filter: { _id: new ObjectId(id) },
        update: { $set: { order: index, updatedAt: new Date() } }
      }
    }));

  if (ops.length > 0) {
    await col.bulkWrite(ops);
  }

  const list = await col
    .find({})
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  return list.map(serializeMember);
}
