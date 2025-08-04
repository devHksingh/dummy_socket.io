
import { config } from '../config/config.js'
import { HttpError } from 'http-errors'



function globalErrorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        message: err.message,
        errorStack: config.env === 'development' ? err.stack : '',
    });
}



export default globalErrorHandler