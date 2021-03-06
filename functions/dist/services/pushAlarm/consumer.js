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
exports.nightFunc = exports.afterFunc = exports.morningFunc = void 0;
const models_1 = require("../../models");
const _1 = require("./");
const dayjs_1 = __importDefault(require("dayjs"));
const messageConsumer_1 = require("./messageConsumer");
const logger = require("../../api/middlewares/logger");
function getTokenMessage(time, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const wal = yield models_1.TodayWal.findOne({
                where: { time: time, user_id: userId },
                include: [
                    { model: models_1.User, attributes: ["fcmtoken"] }
                ]
            });
            const fcmtoken = wal === null || wal === void 0 ? void 0 : wal.getDataValue("user").getDataValue("fcmtoken");
            const userDefined = wal === null || wal === void 0 ? void 0 : wal.getDataValue("userDefined");
            let content = "";
            if (userDefined) {
                const reservation = yield models_1.Reservation.findOne({
                    where: { id: wal === null || wal === void 0 ? void 0 : wal.getDataValue("reservation_id") }
                });
                content = reservation === null || reservation === void 0 ? void 0 : reservation.content;
            }
            else {
                const item = yield models_1.Item.findOne({
                    where: { id: wal === null || wal === void 0 ? void 0 : wal.getDataValue("item_id") }
                });
                content = item === null || item === void 0 ? void 0 : item.content;
            }
            const data = {
                fcmtoken,
                content
            };
            return data;
        }
        catch (err) {
            console.log({ level: "error", message: err.message });
        }
    });
}
const morningFunc = (job, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = job.data;
        const dateString = (0, dayjs_1.default)(new Date()).format("YYYY-MM-DD");
        const data = yield getTokenMessage(new Date(`${dateString} 08:00:00`), userId);
        // data : { fcm, content }
        yield _1.messageQueue.add(data, {
            attempts: 5
        });
        yield _1.messageQueue.process(messageConsumer_1.messageFunc);
        done();
    }
    catch (err) {
        console.log({ level: "error", message: err.message });
    }
});
exports.morningFunc = morningFunc;
const afterFunc = (job, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = job.data;
        const dateString = (0, dayjs_1.default)(new Date()).format("YYYY-MM-DD");
        const data = yield getTokenMessage(new Date(`${dateString} 12:00:00`), userId);
        yield _1.messageQueue.add(data, {
            attempts: 5
        });
        yield _1.messageQueue.process(messageConsumer_1.messageFunc);
        done();
    }
    catch (err) {
        console.log({ level: "error", message: err.message });
    }
});
exports.afterFunc = afterFunc;
const nightFunc = (job, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = job.data;
        const dateString = (0, dayjs_1.default)(new Date()).format("YYYY-MM-DD");
        const data = yield getTokenMessage(new Date(`${dateString} 20:00:00`), userId);
        yield _1.messageQueue.add(data, {
            attempts: 5
        });
        yield _1.messageQueue.process(messageConsumer_1.messageFunc);
        done();
    }
    catch (err) {
        console.log({ level: "error", message: err.message });
    }
});
exports.nightFunc = nightFunc;
//# sourceMappingURL=consumer.js.map