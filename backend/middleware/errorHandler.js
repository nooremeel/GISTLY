function notFound(req, res, next) {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
    console.error(err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server error';
    if (err.name === 'CastError') {
        statusCode = 404;
        message = 'Resource not found';
    }
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(', ');
    }
    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value entered';
    }
    if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Malformed JSON in request body';
    }

    res.status(statusCode).json({ success: false, message });
}

module.exports = { notFound, errorHandler };