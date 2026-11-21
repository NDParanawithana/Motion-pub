import { getDb } from '../../config/db.js';

const DB_NAME = 'motionpub_db';
const COLLECTION_NAME = 'site_content';

const LEGACY_HERO_TITLE = "We Create Videos That Make Brands Stand Out.";
const LEGACY_HERO_TEXT = "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling.";

export const DEFAULT_HERO_TITLE = "We make videos that\nMake Brands Standout";
export const DEFAULT_HERO_PARAGRAPH = "Powerful video content for businesses and personal brands ready to capture attention, build influence, and grow.";
export const DEFAULT_HERO_TEXT = DEFAULT_HERO_PARAGRAPH;

const resolveTitle = (raw) => {
  const trimmed = (raw || '').trim();
  if (!trimmed || trimmed === LEGACY_HERO_TITLE) {
    return DEFAULT_HERO_TITLE;
  }
  return trimmed;
};

const resolveParagraph = (raw) => {
  const trimmed = (raw || '').trim();
  if (!trimmed || trimmed === LEGACY_HERO_TEXT) {
    return DEFAULT_HERO_PARAGRAPH;
  }
  return trimmed;
};

/**
 * Access the site_content collection
 */
export async function getContentCollection() {
  const db = await getDb(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

/**
 * Get the current Hero section content (title, paragraph & video)
 */
export async function getHeroContent() {
  try {
    const col = await getContentCollection();
    const doc = await col.findOne({ section: 'hero' });
    if (doc) {
      const title = resolveTitle(doc.title);
      const paragraph = resolveParagraph(doc.paragraph || doc.fullText);
      return {
        title,
        paragraph,
        fullText: paragraph,
        videoUrl: doc.videoUrl || null,
        mediaUrl: doc.videoUrl || null,
        mediaType: doc.mediaType || 'video',
        videoPublicId: doc.videoPublicId || null,
        videoUpdatedAt: doc.videoUpdatedAt || null,
        updatedAt: doc.updatedAt || null
      };
    }
  } catch (err) {
    console.warn('Hero content lookup notice:', err.message);
  }
  return {
    title: DEFAULT_HERO_TITLE,
    paragraph: DEFAULT_HERO_PARAGRAPH,
    fullText: DEFAULT_HERO_PARAGRAPH,
    videoUrl: null,
    mediaUrl: null,
    mediaType: 'video',
    videoPublicId: null,
    videoUpdatedAt: null,
    updatedAt: null
  };
}

/**
 * Update or insert the Hero section title and paragraph
 * @param {{ title?: string, paragraph?: string, fullText?: string } | string} payload
 */
export async function updateHeroContent(payload) {
  const col = await getContentCollection();

  let titleToSave = DEFAULT_HERO_TITLE;
  let paragraphToSave = DEFAULT_HERO_PARAGRAPH;

  if (typeof payload === 'string') {
    paragraphToSave = payload.trim() || DEFAULT_HERO_PARAGRAPH;
    const existing = await col.findOne({ section: 'hero' });
    titleToSave = (existing?.title || '').trim() || DEFAULT_HERO_TITLE;
  } else if (payload && typeof payload === 'object') {
    const existing = await col.findOne({ section: 'hero' });
    titleToSave = (payload.title || '').trim() || (existing?.title || '').trim() || DEFAULT_HERO_TITLE;
    paragraphToSave = (payload.paragraph ?? payload.fullText ?? '').trim() || DEFAULT_HERO_PARAGRAPH;
  }

  const now = new Date();

  await col.updateOne(
    { section: 'hero' },
    {
      $set: {
        section: 'hero',
        title: titleToSave,
        paragraph: paragraphToSave,
        fullText: paragraphToSave,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  return {
    title: titleToSave,
    paragraph: paragraphToSave,
    fullText: paragraphToSave,
    updatedAt: now
  };
}

/**
 * Update or insert the Hero section background media URL, type, and public ID
 * @param {string} videoUrl
 * @param {string} videoPublicId
 * @param {'video'|'image'} mediaType
 */
export async function updateHeroVideo(videoUrl, videoPublicId, mediaType = 'video') {
  const col = await getContentCollection();

  // Get current doc to retrieve old public ID if needed for cleanup
  const prevDoc = await col.findOne({ section: 'hero' });
  const now = new Date();
  const normalizedType = mediaType === 'image' ? 'image' : 'video';

  await col.updateOne(
    { section: 'hero' },
    {
      $set: {
        section: 'hero',
        videoUrl,
        videoPublicId,
        mediaType: normalizedType,
        videoUpdatedAt: now
      }
    },
    { upsert: true }
  );

  return {
    videoUrl,
    mediaUrl: videoUrl,
    mediaType: normalizedType,
    videoPublicId,
    videoUpdatedAt: now,
    previousPublicId: prevDoc?.videoPublicId || null,
    previousMediaType: prevDoc?.mediaType || 'video'
  };
}

/**
 * Reset Hero background media back to default template video
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
        mediaType: 'video',
        videoUpdatedAt: new Date()
      }
    },
    { upsert: true }
  );

  return {
    previousPublicId: prevDoc?.videoPublicId || null,
    previousMediaType: prevDoc?.mediaType || 'video'
  };
}
