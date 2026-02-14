function errorHandler(error, _req, res, _next) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    if (process.env.NODE_ENV !== 'production') {
        console.error(error);
    }
    // Handle some Postgres-specific errors for friendlier messages
    if (error && error.code && error.code.startsWith && error.code.startsWith('23')) {
        // constraint violation
        return res.status(409).json({ success: false, message: 'Database constraint error' });
    }

    res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;
