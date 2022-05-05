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
exports.sendMessage = exports.messageQueue = void 0;
const models_1 = require("../models");
const bull_1 = __importDefault(require("bull"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const logger = require("../middlewares/logger");
exports.messageQueue = new bull_1.default('message-queue1', {
    redis: {
        host: "redis-16916.c74.us-east-1-4.ec2.cloud.redislabs.com",
        port: 16916,
        password: "jTurgwWogsvIg1Gt9QiGdWA6q1dXmznh",
        username: "default"
    }
});
// for문 돌려서 정보들 사악 뽑아주기 => 얘를 12시간에 한번씩 실행시켜주면 되지 않을까?
function extractInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield models_1.User.findAll({
            include: [
                { model: models_1.Time, attributes: ["morning", "afternoon", "night"] },
                { model: models_1.UserCategory, attributes: ["category_id", "next_item_id"] },
            ],
            attributes: ["id", "fcmtoken"]
        });
        for (const user of users) {
            const userId = user.getDataValue("id");
            const randomIdx = Math.floor(Math.random() * (user.getDataValue("userCategories").length - 1));
            const currentItemId = user
                .getDataValue("userCategories")[randomIdx]
                .getDataValue("next_item_id");
            const sameCategoryItems = yield models_1.Item.findAll({
                where: {
                    category_id: user
                        .getDataValue("userCategories")[randomIdx]
                        .getDataValue("category_id")
                }
            });
            const itemValues = sameCategoryItems["dataValues"];
            const item = itemValues.filter((it) => it.id === currentItemId);
            const itemIdx = itemValues.indexOf(item);
            const nextItemId = (itemIdx + 1) % itemValues.length;
            yield models_1.UserCategory.update({
                next_item_id: nextItemId
            }, {
                where: {
                    user_id: userId
                }
            });
            const fcmToken = user.getDataValue("fcmtoken");
            const messageContent = yield models_1.Item.findOne({ where: { id: currentItemId } });
            const data = {
                fcmToken,
                messageContent
            };
            const selectedTime = [];
            const times = yield models_1.Time.findOne({
                where: { user_id: userId }
            });
            if (times["dataValues"]["morning"]) {
                selectedTime.push(12);
            }
            if (times["dataValues"]["afternoon"]) {
                selectedTime.push(14);
            }
            if (times["dataValues"]["night"]) {
                selectedTime.push(20);
            }
            for (const t in selectedTime) {
                sendMessage(data, t);
            }
        }
    });
}
function messageProcess(job) {
    return __awaiter(this, void 0, void 0, function* () {
        // messageQueue.add 로 추가해준 작업
        // messageQueue.process 로 실행
        const deviceToken = job.data.fcmtoken;
        let message = {
            notification: {
                title: '테스트 발송💛',
                body: job.data.content, // 카테고리 아이디로 item 에서 content 뽑아서 여기다 ㅇㅇ
            },
            token: deviceToken,
        };
    });
}
const messageToUser = (req, res, message) => {
    firebase_admin_1.default
        .messaging()
        .send(message)
        .then(function (response) {
        console.log('Successfully sent message: : ', response);
        return res.status(200).json({ success: true });
    })
        .catch(function (err) {
        console.log('Error Sending message!!! : ', err);
        return res.status(400).json({ success: false });
    });
};
exports.messageQueue.process(messageProcess);
function sendMessage(data, time) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exports.messageQueue.add(data, {
                repeat: { cron: `* ${time} * * *` }
            });
        }
        catch (error) {
            logger.appLogger.log({
                level: "error",
                message: error.message
            });
        }
    });
}
exports.sendMessage = sendMessage;
//# sourceMappingURL=pushAlarm.js.map