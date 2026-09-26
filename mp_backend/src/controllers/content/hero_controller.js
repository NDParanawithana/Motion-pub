import {
  getHeroContent,
  updateHeroContent,
  DEFAULT_HERO_TEXT
} from '../../models/content/hero_model.js';

/**
 * GET /api/content/hero
 */
export async function handleGetHero(req, res) {
  try {
    const data = await getHeroContent();
    res.status(200).json({
      success: true,
      fullText: data.fullText,
      updatedAt: data.updatedAt
    });
  } catch (error) {
    console.error('Error fetching hero content:', error);
    res.status(200).json({
      success: true,
      fullText: DEFAULT_HERO_TEXT,
      fallback: true
    });
  }
}

/**
 * PUT /api/content/hero
 * POST /api/content/hero
 */
export async function handleUpdateHero(req, res) {
  try {
    const { fullText } = req.body || {};

    if (typeof fullText !== 'string' || !fullText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid hero text string is required.'
      });
    }

    const updated = await updateHeroContent(fullText);

    res.status(200).json({
      success: true,
      message: 'Hero content updated successfully!',
      fullText: updated.fullText,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    console.error('Error updating hero content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save hero content to database.',
      error: error.message
    });
  }
}
