function errorHandler(error, _req, res, _next) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    if (process.env.NODE_ENV !== 'production') {
        console.error(error);
    }

    res.status(statusCode).json({
        success: false,
        message
    });
}

module.exports = errorHandler;
