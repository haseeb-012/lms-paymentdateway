import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet';
import  mongoSanitize from "express-mongo-sanitize"
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import cors from 'cors';
dotenv.config({ path: './.env' });




const app = express();
const PORT = process.env.PORT || 3000;

// Global rate limiting 

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 10b0 requests per `window` (here, per 15 minutes).
  message:"Too many requests from this IP, please try again later.",
})

// security middleware
app.use(hpp());
app.use(helmet());
app.use("/api",limiter)
app.use(mongoSanitize());
 

// logging middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true , limit: '10kb' }));
app.use(cookieParser());


// Global Error Handler
app.use((err, req, res, next) =>{
    console.error(err.stack);
    res.status(err.status || 500).json(
        { message: 'Internal Server Error' },
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    );
    
});

// CORS middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH','HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With','device-remember-token',
      'Origin','Accept','Access-Control-Allow-Origin'
    ],
}));

//API Routes



//  404 handler
// it should be placed after all routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} and ${process.env.NODE_ENV} mode`);
});
