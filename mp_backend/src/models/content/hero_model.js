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
 * Get the current Hero section content (text & video)
 */
export async function getHeroContent() {
  try {
    const col = await getContentCollection();
    const doc = await col.findOne({ section: 'hero' });
    if (doc) {
      return {
        fullText: doc.fullText || DEFAULT_HERO_TEXT,
        videoUrl: doc.videoUrl || null,
        videoPublicId: doc.videoPublicId || null,
        videoUpdatedAt: doc.videoUpdatedAt || null,
        updatedAt: doc.updatedAt || null
      };
    }
  } catch (err) {
    console.warn('Hero content lookup notice:', err.message);
  }
  return {
    fullText: DEFAULT_HERO_TEXT,
    videoUrl: null,
    videoPublicId: null,
    videoUpdatedAt: null,
    updatedAt: null
  };
}

/**
 * Update or insert the Hero section statement text
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

/**
 * Update or insert the Hero section video URL and public ID
 * @param {string} videoUrl
 * @param {string} videoPublicId
 */
export async function updateHeroVideo(videoUrl, videoPublicId) {
  const col = await getContentCollection();

  // Get current doc to retrieve old public ID if needed for cleanup
  const prevDoc = await col.findOne({ section: 'hero' });

  await col.updateOne(
    { section: 'hero' },
    {
      $set: {
        section: 'hero',
        videoUrl,
        videoPublicId,
        videoUpdatedAt: new Date()
      }
    },
    { upsert: true }
  );

  return {
    videoUrl,
    videoPublicId,
    videoUpdatedAt: new Date(),
    previousPublicId: prevDoc?.videoPublicId || null
  };
}

/**
 * Reset Hero video back to default template video
 */
export async function resetHeroVideo() {
  const col = await getContentCollection();
  const prevDoc = await col.findOne({ section: 'hero' });

  await col.updateOne(
    { section: 'hero' },
    {
      $set: {
        section: 'hero',
        videoUrl: null,
        videoPublicId: null,
        videoUpdatedAt: new Date()
      }
    },
    { upsert: true }
  );

  return {
    previousPublicId: prevDoc?.videoPublicId || null
  };
}
