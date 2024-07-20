const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'abrakadabra';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError('No authentication token provided', 401);
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        req.userId = decoded.userId;
        req.user = { id: decoded.userId };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new ApiError('Invalid token', 401));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new ApiError('Token expired', 401));
        } else {
            next(error);
        }
    }
};

module.exports = {
    authMiddleware
};
