/**
 * JWT Helper Functions
 */

const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_restaurant_key_2026_jwt_token';
  const expiresIn = process.env.JWT_EXPIRE || '24h';

  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId || null
    },
    secret,
    { expiresIn }
  );
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_restaurant_key_2026_jwt_token';
  return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };
