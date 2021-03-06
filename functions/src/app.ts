import * as functions from "firebase-functions";
import 'reflect-metadata';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import apiRouter from './api/routes';
import { connectDB } from './loaders/db';
import { initFirebase } from "./loaders/firebase";
import { updateToday } from "./services/pushAlarm";

const app = express();
import logger from './api/middlewares/logger';
const morganFormat = process.env.NODE_ENV !== "production" ? "dev" : "combined";

initFirebase(); // firebase 연결
connectDB(); // db 연결
updateToday(); //자정마다 todayWal 업데이트

app.use(cors());
app.use(morgan('HTTP/:http-version :method :url :status', { 
  stream: logger.httpLogStream 
})); // NOTE: http request 로그 남기기
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// 라우팅
app.use("/v1", apiRouter);

app.use("*", (req, res) => {
    res.status(404).json({
        status: 404,
        success: false,
        message: "잘못된 경로입니다."
    });
    //app log 남기기
    const err = new Error(`잘못된 경로입니다.`);
    logger.appLogger.log({
        level: 'error',
        message: err.message
    })
});


export const api = functions
    .runWith({
        timeoutSeconds: 300,
        memory: "512MB"
    })
    .region("asia-northeast3")
    .https.onRequest(app);