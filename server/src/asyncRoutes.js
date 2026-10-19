import Layer from "express/lib/router/layer.js";

Layer.prototype.handle_request = function handle(req, res, next) {
  const fn = this.handle;
  if (fn.length > 3) return next();
  try {
    const out = fn(req, res, next);
    if (out && typeof out.then === "function") out.then(undefined, next);
  } catch (error) {
    next(error);
  }
};
