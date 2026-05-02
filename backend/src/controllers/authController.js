const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');

const getFirstAdminId = async () => {
  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'Admin' ORDER BY id ASC LIMIT 1");
  return admins.length > 0 ? admins[0].id : null;
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const [allUsers] = await pool.query('SELECT id FROM users LIMIT 1');
    if (allUsers.length > 0) {
      return res.status(403).json({ message: 'Signup is disabled. Only the system administrator can create new accounts.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'Admin']
    );

    const token = generateToken({
      id: result.insertId,
      email,
      role: 'Admin',
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        role: 'Admin',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // deliberately vague — don't tell the client which field was wrong
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY name ASC'
    );

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// called by admin from the users management page
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.insertId,
        name,
        email,
        role,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const [users] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // admin can't demote themselves, would lock them out
    if (Number(userId) === req.user.id && role !== 'Admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    const firstAdminId = await getFirstAdminId();
    if (Number(userId) === firstAdminId && req.user.id !== firstAdminId) {
      return res.status(403).json({ message: 'Only the First Admin can modify their own account' });
    }

    const [emailUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id <> ?',
      [email, userId]
    );

    if (emailUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // make sure there's always at least one admin left
    if (users[0].role === 'Admin' && role !== 'Admin') {
      const [admins] = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['Admin']
      );

      if (admins[0].count <= 1) {
        return res.status(400).json({ message: 'At least one admin account is required' });
      }
    }

    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name, email, role, userId]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const firstAdminId = await getFirstAdminId();
    if (Number(userId) === firstAdminId && req.user.id !== firstAdminId) {
      return res.status(403).json({ message: 'Only the First Admin can change their own password' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const firstAdminId = await getFirstAdminId();

    if (Number(userId) === req.user.id && req.user.id !== firstAdminId) {
      return res.status(400).json({ message: 'You cannot delete your own account. Only the First Admin can delete their account.' });
    }

    if (Number(userId) === firstAdminId && req.user.id !== firstAdminId) {
      return res.status(403).json({ message: 'Only the First Admin can delete their own account.' });
    }

    const [users] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (users[0].role === 'Admin') {
      const [admins] = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['Admin']
      );

      if (admins[0].count <= 1) {
        return res.status(400).json({ message: 'At least one admin account is required' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, name, email, password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // if they want to change password, verify current one first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new one' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        'UPDATE users SET name = ?, password = ? WHERE id = ?',
        [name || user.name, hashedPassword, userId]
      );
    } else {
      await pool.query(
        'UPDATE users SET name = ? WHERE id = ?',
        [name || user.name, userId]
      );
    }

    const [updated] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Profile updated successfully', user: updated[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  getAllUsers,
  createUser,
  updateUser,
  changeUserPassword,
  deleteUser,
  updateProfile,
};
