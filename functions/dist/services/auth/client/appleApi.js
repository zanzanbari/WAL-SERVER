"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appleAuthApi = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const qs_1 = __importDefault(require("qs"));
const tokenHandller_1 = require("../../../modules/tokenHandller");
const axios_1 = __importDefault(require("axios"));
const logger = require("../../../api/middlewares/logger");
function appleAuthApi(code, clientId) {
    return __awaiter(this, void 0, void 0, function* () {
        // 인가 코드의 유효성 검증하고 토큰 받아오기
        const apiUrl = "https://appleid.apple.com/auth/token";
        const queryString = qs_1.default.stringify({
            client_id: clientId,
            client_secret: (0, tokenHandller_1.issueAppleClientSecret)(clientId),
            code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.APPLE_REDIRECT_URI,
        });
        const reqConfig = {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            }
        };
        try {
            const result = yield axios_1.default.post(apiUrl, queryString, reqConfig)
                .then(resolve => {
                console.log("-----------");
                console.log("resolve.data : ", resolve.data);
                console.log("-----------");
                return resolve.data;
            })
                .catch(err => { return err; });
            console.log("-----------");
            console.log("result : ", result);
            console.log("-----------");
            if ("id_token" in result) {
                const { email } = jsonwebtoken_1.default.decode(result["id_token"]);
                const nickname = null;
                return { email, nickname };
            }
        }
        catch (error) {
            logger.appLogger.log({
                level: "error",
                message: error.message
            });
            throw new Error(error.message);
        }
    });
}
exports.appleAuthApi = appleAuthApi;
//# sourceMappingURL=appleApi.js.map