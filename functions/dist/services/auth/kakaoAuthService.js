"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const kakaoApi_1 = require("./client/kakaoApi");
const tokenHandller_1 = require("../../modules/tokenHandller");
let KakaoAuthService = class KakaoAuthService {
    // 주입해주고 싶다 
    constructor(userRepository, logger) {
        this.userRepository = userRepository;
        this.logger = logger;
    }
    login(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield (0, kakaoApi_1.KakaoAuthApi)(request.socialtoken);
                const refreshtoken = yield (0, tokenHandller_1.issueRefreshToken)();
                const socialUser = yield this.userRepository.findByEmailOrCreateSocialUser("kakao", userData, request, refreshtoken);
                const accesstoken = yield (0, tokenHandller_1.issueAccessToken)(socialUser);
                const user = {
                    nickname: socialUser.nickname,
                    accesstoken,
                    refreshtoken
                };
                return user;
            }
            catch (error) {
                this.logger.appLogger.log({
                    level: "error",
                    message: error.message
                });
                throw new Error(error);
            }
        });
    }
    resign(userId, request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const unlinkedUser = (0, kakaoApi_1.KakaoUnlinkApi)(request.socialtoken);
                const resignedUser = this.userRepository.findAndDelete(userId);
                yield unlinkedUser;
                return yield resignedUser;
            }
            catch (error) {
                this.logger.appLogger.log({
                    level: "error",
                    message: error.message
                });
                throw new Error(error);
            }
        });
    }
};
KakaoAuthService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [Object, Object])
], KakaoAuthService);
exports.default = KakaoAuthService;
//# sourceMappingURL=kakaoAuthService.js.map