"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const routes_1 = __importDefault(require("./api/routes"));
const db_1 = require("./loaders/db");
// import { messageSchedule} from './loaders/notification';
// messageSchedule();
//initialize firebase inorder to access its services
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(require("../key/firebase-admin.json"))
});
const app = (0, express_1.default)();
const logger = require('./api/middlewares/logger');
const morganFormat = process.env.NODE_ENV !== "production" ? "dev" : "combined";
// db 연결
(0, db_1.connectDB)();
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('HTTP/:http-version :method :url :status', {
    stream: logger.httpLogStream
})); // NOTE: http request 로그 남기기
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// 라우팅
app.use("/v1", routes_1.default);
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
    });
});
exports.api = functions
    .runWith({
    timeoutSeconds: 300,
    memory: "512MB"
})
    .region("asia-northeast3")
    .https.onRequest(app);
//# sourceMappingURL=app.js.map