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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserTime = void 0;
const models_1 = require("../../models");
const _1 = require("./");
const logger = require("../../api/middlewares/logger");
function addUserTime(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //user id를 data로 전달
            const times = yield models_1.Time.findOne({
                where: { user_id: userId }
            });
            if (times.morning) {
                yield _1.morningQueue.add(userId, {
                    repeat: { cron: `* 8 * * *` }
                });
            }
            if (times.afternoon) {
                yield _1.afternoonQueue.add(userId, {
                    repeat: { cron: `* 12 * * *` }
                });
            }
            if (times.night) {
                yield _1.nightQueue.add(userId, {
                    repeat: { cron: `* 20 * * *` }
                });
            }
        }
        catch (err) {
            logger.appLogger.log({ level: "error", message: err.message });
        }
    });
}
exports.addUserTime = addUserTime;
//# sourceMappingURL=producer.js.map