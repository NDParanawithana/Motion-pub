import { getDb } from '../../config/db.js';

const DB_NAME = 'motionpub_db';
const COLLECTION_NAME = 'site_content';

export const DEFAULT_HERO_TEXT = "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling.";

/**
 * Access the site_content collection
 */
export async function getContentCollection() {
  const db = await getDb(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

/**
 * Get the current Hero section content
 */
export async function getHeroContent() {
  try {
    const col = await getContentCollection();
    const doc = await col.findOne({ section: 'hero' });
    if (doc && doc.fullText) {
      return {
        fullText: doc.fullText,
        updatedAt: doc.updatedAt || null
      };
    }
  } catch (err) {
    console.warn('Hero content lookup notice:', err.message);
  }
  return {
    fullText: DEFAULT_HERO_TEXT,
    updatedAt: null
  };
}

/**
 * Update or insert the Hero section content
 * @param {string} fullText
 */
export async function updateHeroContent(fullText) {
  const col = await getContentCollection();
  const textToSave = (fullText || '').trim() || DEFAULT_HERO_TEXT;

  await col.updateOne(
    { section: 'hero' },
    {
      $set: {
        section: 'hero',
        fullText: textToSave,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  return {
    fullText: textToSave,
    updatedAt: new Date()
  };
}
