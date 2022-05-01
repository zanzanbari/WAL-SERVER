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
exports.reserveController = void 0;
const models_1 = require("../../models");
const sequelize_1 = require("sequelize");
const apiResponse_1 = require("../../modules/apiResponse");
const resultCode_1 = __importDefault(require("../../constant/resultCode"));
const resultMessage_1 = __importDefault(require("../../constant/resultMessage"));
const logger = require("../middlewares/logger");
const dayjs_1 = __importDefault(require("dayjs"));
const dayArr = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
const getHistoryDateMessage = (rawDate) => {
    try {
        const monthDate = (0, dayjs_1.default)(rawDate).format("MM. DD");
        let time = (0, dayjs_1.default)(rawDate).format(":mm");
        let hour = (0, dayjs_1.default)(rawDate);
        if ((0, dayjs_1.default)(rawDate).hour() >= 12) {
            time = ` 오후 ${(0, dayjs_1.default)(rawDate).hour() - 12}` + time;
        }
        else {
            time = ` 오전 ${(0, dayjs_1.default)(rawDate).hour()}` + time;
        }
        const day = dayArr[(0, dayjs_1.default)(rawDate).day()];
        return {
            monthDate,
            day,
            time
        };
    }
    catch (err) {
        console.log(err);
    }
};
const getReservation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const sendingData = [], completeData = [];
        const data = {
            sendingData,
            completeData
        };
        const sendingDataItems = yield models_1.Reservation.findAll({
            where: {
                user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                completed: false
            },
            order: [
                ["reservedAt", "DESC"],
                ["sendingDate", "DESC"]
            ] //보낸 날짜 desc정렬
        });
        const completeDataItems = yield models_1.Reservation.findAll({
            where: {
                user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
                completed: true
            },
            order: [
                ["sendingDate", "DESC"]
            ] //받은 날짜 desc정렬
        });
        if (sendingDataItems.length < 1 && completeDataItems.length < 1) {
            (0, apiResponse_1.SuccessResponse)(res, resultCode_1.default.OK, resultMessage_1.default.NO_RESERVATION, data);
        }
        for (const item of sendingDataItems) {
            const rawDate = item.getDataValue("sendingDate");
            const historyMessage = getHistoryDateMessage(rawDate);
            const sendingDate = (historyMessage === null || historyMessage === void 0 ? void 0 : historyMessage.monthDate) + " " + (historyMessage === null || historyMessage === void 0 ? void 0 : historyMessage.day) + (historyMessage === null || historyMessage === void 0 ? void 0 : historyMessage.time) + " • 전송 예정";
            sendingData.push({
                sendingDate,
                content: item.getDataValue("content"),
                reservedAt: (0, dayjs_1.default)(item.getDataValue("reservedAt")).format("YYYY. MM. DD"),
                hidden: item.getDataValue("hide")
            });
        }
        for (const item of completeDataItems) {
            const rawDate = item.getDataValue("sendingDate");
            const historyMessage = getHistoryDateMessage(rawDate);
            const sendingDate = (historyMessage === null || historyMessage === void 0 ? void 0 : historyMessage.monthDate) + " " + (historyMessage === null || historyMessage === void 0 ? void 0 : historyMessage.day) + (historyMessage === null || historyMessage === void 0 ? void 0 : historyMessage.time) + " • 전송 완료";
            completeData.push({
                sendingDate,
                content: item.getDataValue("content"),
                reservedAt: (0, dayjs_1.default)(item.getDataValue("reservedAt")).format("YYYY. MM. DD")
            });
        }
        (0, apiResponse_1.SuccessResponse)(res, resultCode_1.default.OK, resultMessage_1.default.READ_RESERVATIONS_SUCCESS, data);
    }
    catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.INTERNAL_SERVER_ERROR, resultMessage_1.default.INTERNAL_SERVER_ERROR);
        return next(err);
    }
});
const postReservation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.INTERNAL_SERVER_ERROR, resultMessage_1.default.INTERNAL_SERVER_ERROR);
        return next(err);
    }
});
const getReservedDate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const date = [];
        const data = { date };
        const today = new Date();
        const reservedDateItems = yield models_1.Reservation.findAll({
            where: {
                user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
                sendingDate: {
                    [sequelize_1.Op.gt]: today
                }
            },
            attributes: ["sendingDate"]
        });
        if (reservedDateItems.length < 1) {
            (0, apiResponse_1.SuccessResponse)(res, resultCode_1.default.OK, resultMessage_1.default.NO_RESERVATION_DATE, data);
        }
        for (const item of reservedDateItems) {
            const reservedDate = item.getDataValue("sendingDate");
            date.push((0, dayjs_1.default)(reservedDate).format("YYYY-MM-DD"));
        }
        data.date = date.sort();
        (0, apiResponse_1.SuccessResponse)(res, resultCode_1.default.OK, resultMessage_1.default.READ_RESERVED_DATE_SUCCESS, data);
    }
    catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.INTERNAL_SERVER_ERROR, resultMessage_1.default.INTERNAL_SERVER_ERROR);
        return next(err);
    }
});
const deleteReservation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.INTERNAL_SERVER_ERROR, resultMessage_1.default.INTERNAL_SERVER_ERROR);
        return next(err);
    }
});
const deleteCompletedReservation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.INTERNAL_SERVER_ERROR, resultMessage_1.default.INTERNAL_SERVER_ERROR);
        return next(err);
    }
});
exports.reserveController = {
    getReservation,
    postReservation,
    getReservedDate,
    deleteReservation,
    deleteCompletedReservation
};
//# sourceMappingURL=reserveController.js.map