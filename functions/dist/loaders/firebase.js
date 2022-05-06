"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccount = require("../../key/firebase-admin.json");
const logger_1 = __importDefault(require("../api/middlewares/logger"));
//initialize firebase inorder to access its services
const initFirebase = () => {
    let firebase;
    try {
        if (firebase_admin_1.default.apps.length === 0) {
            firebase = firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount)
            });
        }
        else {
            firebase = firebase_admin_1.default.app();
        }
    }
    catch (error) {
        logger_1.default.appLogger.log({ level: "error", message: error.message });
        throw new Error(error.message);
    }
};
exports.initFirebase = initFirebase;
//# sourceMappingURL=firebase.js.map