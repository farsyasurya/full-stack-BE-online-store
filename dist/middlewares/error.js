"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error(err);
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json(Object.assign({ success: false, message }, (process.env.NODE_ENV === "development" && { stack: err.stack })));
}
