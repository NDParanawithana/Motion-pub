import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';

const DB_NAME = 'motionpub_db';
const COLLECTION_NAME = 'testimonials';
const VALID_VARIANTS = ['tone-lime', 'tone-emerald', 'tone-olive'];

export const DEFAULT_TESTIMONIALS = [
  {
    name: 'Kavinda Perera',
    tagline: 'Founder, CeylonPay Digital',
    quote:
      'Motion Pub turned our product concept into a vibrant 2D animated commercial that outperformed every ad we had run before. Crisp storytelling and effortless collaboration.',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
    avatarPublicId: null,
    variant: 'tone-lime',
    order: 0,
  },
  {
    name: 'Sarah Jenkins',
    tagline: 'Head of Brand, Nova Systems',
    quote:
      'Their post-production pacing, color treatments, and sound design gave our launch campaign a cinema-grade finish. Our social reels saw 3× higher retention within the first week.',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    avatarPublicId: null,
    variant: 'tone-emerald',
    order: 1,
  },
  {
    name: 'Daniel Brooks',
    tagline: 'Co-Founder, Pulse Technologies',
    quote:
      'Working across time zones was completely seamless. Motion Pub delivered our animated company profile ahead of schedule with sharp motion graphics that elevated our pitch.',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    avatarPublicId: null,
    variant: 'tone-olive',
    order: 2,
  },
  {
    name: 'Nadia Fernando',
    tagline: 'Marketing Director, Kandy Roasters',
    quote:
      'From script rhythm to final motion polish, the team understood our Sri Lankan and international audiences equally well. Easily our go-to partner for every promotional campaign.',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    avatarPublicId: null,
    variant: 'tone-lime',
    order: 3,
  },
  {
    name: 'Rohan De Silva',
    tagline: 'Product Lead, FinTrack App',
    quote:
      'Their app promo video made complex workflows feel effortless in under 45 seconds. Clean art direction, punchy sound design, and zero friction from brief to final export.',
    avatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
    avatarPublicId: null,
    variant: 'tone-emerald',
    order: 4,
  },
  {
    name: 'Amaya Wijesinghe',
    tagline: 'Creative Lead, LankaTech Studio',
    quote:
      'Every frame felt intentional and on-brand. Motion Pub helped us refresh our entire social video identity with sleek animated visuals that instantly set us apart.',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
    avatarPublicId: null,
    variant: 'tone-olive',
    order: 5,
  },
];

const sanitizeVariant = (variant) =>
  VALID_VARIANTS.includes(variant) ? variant : 'tone-lime';

const serializeTestimonial = (doc) => ({
  id: doc._id.toString(),
  _id: doc._id.toString(),
  name: doc.name || '',
  tagline: doc.tagline || '',
  quote: doc.quote || '',
  avatar: doc.avatar || '',
  avatarPublicId: doc.avatarPublicId || null,
  variant: sanitizeVariant(doc.variant),
  order: typeof doc.order === 'number' ? doc.order : 0,
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null,
});

export async function getTestimonialsCollection() {
  const db = await getDb(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

/**
 * Retrieve all testimonials sorted by order.
 * Seeds default testimonials once if the collection has never been initialized.
 */
export async function getAllTestimonials() {
  const db = await getDb(DB_NAME);
  const col = db.collection(COLLECTION_NAME);
  const metaCol = db.collection('site_content');

  const count = await col.countDocuments();
  if (count === 0) {
    const meta = await metaCol.findOne({ section: 'testimonials_meta' });
    if (!meta?.seeded) {
      const now = new Date();
      const docs = DEFAULT_TESTIMONIALS.map((item) => ({
        ...item,
        createdAt: now,
        updatedAt: now,
      }));
      await col.insertMany(docs);
      await metaCol.updateOne(
        { section: 'testimonials_meta' },
        { $set: { section: 'testimonials_meta', seeded: true, updatedAt: now } },
        { upsert: true }
      );
    }
  }

  const list = await col
    .find({})
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  return list.map(serializeTestimonial);
}

/**
 * Create a new testimonial
 */
export async function createTestimonial(payload) {
  const col = await getTestimonialsCollection();
  const count = await col.countDocuments();
  const now = new Date();

  const doc = {
    name: String(payload.name || '').trim(),
    tagline: String(payload.tagline || '').trim(),
    quote: String(payload.quote || '').trim(),
    avatar: typeof payload.avatar === 'string' ? payload.avatar.trim() : '',
    avatarPublicId: payload.avatarPublicId || null,
    variant: sanitizeVariant(payload.variant),
    order: typeof payload.order === 'number' ? payload.order : count,
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc);
  return serializeTestimonial({ ...doc, _id: result.insertedId });
}

/**
 * Update an existing testimonial by ID
 */
export async function updateTestimonial(id, payload) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid testimonial ID.');
  }

  const col = await getTestimonialsCollection();
  const objectId = new ObjectId(id);
  const existing = await col.findOne({ _id: objectId });

  if (!existing) {
    throw new Error('Testimonial not found.');
  }

  const updateFields = {
    updatedAt: new Date(),
  };

  if (payload.name !== undefined) {
    updateFields.name = String(payload.name).trim();
  }
  if (payload.tagline !== undefined) {
    updateFields.tagline = String(payload.tagline).trim();
  }
  if (payload.quote !== undefined) {
    updateFields.quote = String(payload.quote).trim();
  }
  if (payload.avatar !== undefined) {
    updateFields.avatar = typeof payload.avatar === 'string' ? payload.avatar.trim() : '';
  }
  if (payload.avatarPublicId !== undefined) {
    updateFields.avatarPublicId = payload.avatarPublicId || null;
  }
  if (payload.variant !== undefined) {
    updateFields.variant = sanitizeVariant(payload.variant);
  }
  if (typeof payload.order === 'number') {
    updateFields.order = payload.order;
  }

  await col.updateOne({ _id: objectId }, { $set: updateFields });
  const updatedDoc = await col.findOne({ _id: objectId });

  const previousAvatarPublicId =
    existing.avatarPublicId &&
    updateFields.avatarPublicId !== undefined &&
    existing.avatarPublicId !== updateFields.avatarPublicId
      ? existing.avatarPublicId
      : null;

  return {
    testimonial: serializeTestimonial(updatedDoc),
    previousAvatarPublicId,
  };
}

/**
 * Delete a testimonial by ID
 */
export async function deleteTestimonial(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid testimonial ID.');
  }

  const col = await getTestimonialsCollection();
  const objectId = new ObjectId(id);
  const existing = await col.findOne({ _id: objectId });

  if (!existing) {
    throw new Error('Testimonial not found.');
  }

  await col.deleteOne({ _id: objectId });

  return {
    deletedId: id,
    previousAvatarPublicId: existing.avatarPublicId || null,
  };
}

/**
 * Persist a new display order for testimonials
 */
export async function reorderTestimonials(orderedIds) {
  const col = await getTestimonialsCollection();
  const ops = orderedIds
    .filter((id) => ObjectId.isValid(id))
    .map((id, index) => ({
      updateOne: {
        filter: { _id: new ObjectId(id) },
        update: { $set: { order: index, updatedAt: new Date() } },
      },
    }));

  if (ops.length > 0) {
    await col.bulkWrite(ops);
  }

  const list = await col
    .find({})
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  return list.map(serializeTestimonial);
}
