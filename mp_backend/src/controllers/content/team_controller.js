import {
  getAllTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
  DEFAULT_TEAM_MEMBERS
} from '../../models/content/team_model.js';
import {
  uploadHeroMediaToCloudinary,
  deleteFromCloudinary
} from '../../middleware/upload.js';

/**
 * GET /api/content/team
 * List all team members ordered for display
 */
export async function handleGetTeam(req, res) {
  try {
    const members = await getAllTeamMembers();
    return res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return res.status(200).json({
      success: true,
      fallback: true,
      data: DEFAULT_TEAM_MEMBERS.map((m, idx) => ({
        ...m,
        id: `default-${idx + 1}`,
        _id: `default-${idx + 1}`
      }))
    });
  }
}

/**
 * POST /api/content/team
 * Create a new team member
 */
export async function handleCreateTeamMember(req, res) {
  try {
    const { name, role, image, imagePublicId, socials, order } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member name is required.'
      });
    }

    if (!role || !String(role).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member role is required.'
      });
    }

    const created = await createTeamMember({
      name,
      role,
      image,
      imagePublicId,
      socials,
      order
    });

    return res.status(201).json({
      success: true,
      message: `${created.name} added to the team!`,
      data: created
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add team member.'
    });
  }
}

/**
 * PUT /api/content/team/:id
 * Update an existing team member
 */
export async function handleUpdateTeamMember(req, res) {
  try {
    const { id } = req.params;
    const { name, role, image, imagePublicId, socials, order } = req.body || {};

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member name cannot be empty.'
      });
    }

    if (role !== undefined && !String(role).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member role cannot be empty.'
      });
    }

    const { member, previousImagePublicId } = await updateTeamMember(id, {
      name,
      role,
      image,
      imagePublicId,
      socials,
      order
    });

    if (previousImagePublicId) {
      deleteFromCloudinary(previousImagePublicId, 'image').catch((err) => {
        console.warn('Notice deleting replaced team image:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: `${member.name} updated successfully!`,
      data: member
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    const status = error.message?.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to update team member.'
    });
  }
}

/**
 * DELETE /api/content/team/:id
 * Remove a team member and clean up their uploaded portrait
 */
export async function handleDeleteTeamMember(req, res) {
  try {
    const { id } = req.params;
    const { deletedId, previousImagePublicId } = await deleteTeamMember(id);

    if (previousImagePublicId) {
      deleteFromCloudinary(previousImagePublicId, 'image').catch((err) => {
        console.warn('Notice deleting removed team image:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Team member removed.',
      deletedId
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    const status = error.message?.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to delete team member.'
    });
  }
}

/**
 * PUT /api/content/team/reorder
 * Save updated order of team members
 */
export async function handleReorderTeamMembers(req, res) {
  try {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderedIds array is required.'
      });
    }

    const members = await reorderTeamMembers(orderedIds);
    return res.status(200).json({
      success: true,
      message: 'Team order updated.',
      data: members
    });
  } catch (error) {
    console.error('Error reordering team members:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reorder team members.'
    });
  }
}

/**
 * POST /api/content/team/upload-image
 * Upload a team member portrait image to Cloudinary
 */
export async function handleUploadTeamImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an image file (JPG, PNG, WebP, AVIF).'
      });
    }

    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files (JPG, PNG, WebP, AVIF) are allowed for team portraits.'
      });
    }

    const result = await uploadHeroMediaToCloudinary(
      req.file.buffer,
      'image',
      'motion_pub/team'
    );

    if (!result?.secure_url) {
      throw new Error('Cloud storage did not return an image URL.');
    }

    return res.status(200).json({
      success: true,
      message: 'Portrait uploaded successfully!',
      imageUrl: result.secure_url,
      imagePublicId: result.public_id
    });
  } catch (error) {
    console.error('Error uploading team portrait:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload portrait image.'
    });
  }
}
