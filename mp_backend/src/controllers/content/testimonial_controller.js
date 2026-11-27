import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  DEFAULT_TESTIMONIALS,
} from '../../models/content/testimonial_model.js';
import {
  uploadHeroMediaToCloudinary,
  deleteFromCloudinary,
} from '../../middleware/upload.js';

/**
 * GET /api/content/testimonials
 * List all testimonials sorted for display
 */
export async function handleGetTestimonials(req, res) {
  try {
    const testimonials = await getAllTestimonials();
    return res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return res.status(200).json({
      success: true,
      fallback: true,
      data: DEFAULT_TESTIMONIALS.map((item, idx) => ({
        ...item,
        id: `default-testi-${idx + 1}`,
        _id: `default-testi-${idx + 1}`,
      })),
    });
  }
}

/**
 * POST /api/content/testimonials
 * Add a new testimonial
 */
export async function handleCreateTestimonial(req, res) {
  try {
    const { name, tagline, quote, avatar, avatarPublicId, variant, order } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Client name is required.',
      });
    }

    if (!tagline || !String(tagline).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Client role / tagline is required.',
      });
    }

    if (!quote || !String(quote).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Testimonial quote is required.',
      });
    }

    const created = await createTestimonial({
      name,
      tagline,
      quote,
      avatar,
      avatarPublicId,
      variant,
      order,
    });

    return res.status(201).json({
      success: true,
      message: `Testimonial from ${created.name} added!`,
      data: created,
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add testimonial.',
    });
  }
}

/**
 * PUT /api/content/testimonials/:id
 * Update an existing testimonial
 */
export async function handleUpdateTestimonial(req, res) {
  try {
    const { id } = req.params;
    const { name, tagline, quote, avatar, avatarPublicId, variant, order } = req.body || {};

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Client name cannot be empty.',
      });
    }

    if (tagline !== undefined && !String(tagline).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Client role / tagline cannot be empty.',
      });
    }

    if (quote !== undefined && !String(quote).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Testimonial quote cannot be empty.',
      });
    }

    const { testimonial, previousAvatarPublicId } = await updateTestimonial(id, {
      name,
      tagline,
      quote,
      avatar,
      avatarPublicId,
      variant,
      order,
    });

    if (previousAvatarPublicId) {
      deleteFromCloudinary(previousAvatarPublicId, 'image').catch((err) => {
        console.warn('Notice deleting replaced testimonial avatar:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: `Testimonial from ${testimonial.name} updated!`,
      data: testimonial,
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    const status = error.message?.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to update testimonial.',
    });
  }
}

/**
 * DELETE /api/content/testimonials/:id
 * Delete a testimonial and clean up uploaded avatar
 */
export async function handleDeleteTestimonial(req, res) {
  try {
    const { id } = req.params;
    const { deletedId, previousAvatarPublicId } = await deleteTestimonial(id);

    if (previousAvatarPublicId) {
      deleteFromCloudinary(previousAvatarPublicId, 'image').catch((err) => {
        console.warn('Notice deleting removed testimonial avatar:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Testimonial removed.',
      deletedId,
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    const status = error.message?.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to delete testimonial.',
    });
  }
}

/**
 * PUT /api/content/testimonials/reorder
 * Persist reordered testimonials list
 */
export async function handleReorderTestimonials(req, res) {
  try {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderedIds array is required.',
      });
    }

    const testimonials = await reorderTestimonials(orderedIds);
    return res.status(200).json({
      success: true,
      message: 'Testimonials order updated.',
      data: testimonials,
    });
  } catch (error) {
    console.error('Error reordering testimonials:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reorder testimonials.',
    });
  }
}

/**
 * POST /api/content/testimonials/upload-image
 * Upload a client avatar image to Cloudinary
 */
export async function handleUploadTestimonialImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an image file (JPG, PNG, WebP, AVIF).',
      });
    }

    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files (JPG, PNG, WebP, AVIF) are allowed for client avatars.',
      });
    }

    const result = await uploadHeroMediaToCloudinary(
      req.file.buffer,
      'image',
      'motion_pub/testimonials'
    );

    if (!result?.secure_url) {
      throw new Error('Cloud storage did not return an image URL.');
    }

    return res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully!',
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });
  } catch (error) {
    console.error('Error uploading testimonial avatar:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload avatar image.',
    });
  }
}
