import {
  findAdminByUsername,
  verifyAdminPassword,
  sanitizeAdmin
} from '../../models/admin/admin_login.js';

/**
 * Handle Administrator Login
 * Route: POST /api/admin/login
 */
export async function handleAdminLogin(req, res) {
  try {
    const { username, password } = req.body || {};

    // 1. Validate inputs
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    // 2. Query admin from motionpub_db.site_admin
    const admin = await findAdminByUsername(username);

    // 3. Verify user existence and password
    if (!admin || !verifyAdminPassword(password, admin.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // 4. Return successful response
    return res.status(200).json({
      success: true,
      message: 'Successfully logged in!',
      user: sanitizeAdmin(admin)
    });

  } catch (error) {
    console.error('❌ Admin login controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error occurred during login. Please try again.',
      error: error.message
    });
  }
}
