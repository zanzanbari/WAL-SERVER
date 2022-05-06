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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appleApi_1 = require("./client/appleApi");
const tokenHandller_1 = require("../../modules/tokenHandller");
class AppleAuthService {
    constructor(userRepository, logger) {
        this.userRepository = userRepository;
        this.logger = logger;
    }
    login(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { aud: clientId } = jsonwebtoken_1.default.decode(request.socialtoken);
                console.log("-----------");
                console.log("client_id : ", clientId);
                console.log("-----------");
                const userData = yield (0, appleApi_1.appleAuthApi)(request.code, clientId);
                console.log("-----------");
                console.log("userData : ", userData);
                console.log("-----------");
                const refreshtoken = yield (0, tokenHandller_1.issueRefreshToken)();
                console.log("-----------");
                console.log("refreshtoken : ", refreshtoken);
                console.log("-----------");
                const socialUser = yield this.userRepository.findByEmailOrCreateSocialUser("kakao", userData, request, refreshtoken);
                console.log("-----------");
                console.log("socialUser : ", socialUser);
                console.log("-----------");
                const accesstoken = yield (0, tokenHandller_1.issueAccessToken)(socialUser);
                console.log("-----------");
                console.log("accesstoken : ", accesstoken);
                console.log("-----------");
                const user = {
                    nickname: socialUser.nickname,
                    accesstoken,
                    refreshtoken
                };
                return user;
            }
            catch (error) {
                console.error(error);
                this.logger.appLogger.log({
                    level: "error",
                    message: error.message
                });
                throw new Error(error);
            }
        });
    }
    resign(userId, token) {
        throw new Error("Method not implemented.");
    }
}
exports.default = AppleAuthService;
//# sourceMappingURL=appleAuthService.js.map