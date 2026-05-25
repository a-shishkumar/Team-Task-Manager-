/**
 * Wraps async route handlers to catch errors automatically
 * Eliminates the need for try-catch in every controller
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
