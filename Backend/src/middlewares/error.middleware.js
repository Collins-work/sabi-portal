const errorHandler = (error, req, res, next) => {
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  const message = status === 500 ? `Internal Server error: ${error.message}` : error.message;
  res.status(status).json({ success: false, message });
};

module.exports = errorHandler