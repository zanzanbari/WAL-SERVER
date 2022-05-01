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
const models_2 = __importDefault(require("../../models"));
const dayArr = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
const getHistoryDateMessage = (rawDate) => {
    try {
        const monthDate = (0, dayjs_1.default)(rawDate).format("MM. DD");
        let time = (0, dayjs_1.default)(rawDate).format(":mm");
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
                postId: item.id,
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
                postId: item.id,
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
    var _c, _d;
    try {
        const { content, hide, date, time } = req.body;
        if (!content || hide == undefined || !date || !time)
            return (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.BAD_REQUEST, resultMessage_1.default.NULL_VALUE);
        const existingReservation = yield models_1.Reservation.findOne({
            where: {
                user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
                $and: models_2.default.where(models_2.default.fn('date', models_2.default.col('sendingDate')), '=', new Date(date))
            }
        });
        if (existingReservation)
            return (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.BAD_REQUEST, resultMessage_1.default.INVALID_RESERVATION_DATE);
        const newReservation = yield models_1.Reservation.create({
            user_id: (_d = req.user) === null || _d === void 0 ? void 0 : _d.id,
            sendingDate: new Date(`${date} ${time}`),
            hide,
            content
        });
        const data = { postId: newReservation.id };
        /**
         * -----------------------------알림 보내는 기능 넣어야 한다 ---------------------------
         *
         */
        (0, apiResponse_1.SuccessResponse)(res, resultCode_1.default.OK, resultMessage_1.default.ADD_RESERVATION_SUCCESS, data);
    }
    catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.INTERNAL_SERVER_ERROR, resultMessage_1.default.INTERNAL_SERVER_ERROR);
        return next(err);
    }
});
const getReservedDate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const date = [];
        const data = { date };
        const today = new Date();
        const reservedDateItems = yield models_1.Reservation.findAll({
            where: {
                user_id: (_e = req.user) === null || _e === void 0 ? void 0 : _e.id,
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
    var _f;
    const postId = req.params.postId;
    if (postId == ":postId")
        return (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.BAD_REQUEST, resultMessage_1.default.WRONG_PARAMS_OR_NULL);
    try {
        const waitingReservation = yield models_1.Reservation.findOne({
            where: {
                id: parseInt(postId),
                user_id: (_f = req.user) === null || _f === void 0 ? void 0 : _f.id,
                completed: false
            }
        });
        if (!waitingReservation)
            return (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.NOT_FOUND, resultMessage_1.default.NO_OR_COMPLETED_RESERVATION);
        /**
         * -------------------------------
            schedule에서 해당 reservation 삭제!!!!!!!!!!!!!!!!!
            -------------------------------
        **/
        yield (waitingReservation === null || waitingReservation === void 0 ? void 0 : waitingReservation.destroy());
        const data = { postId: parseInt(postId) };
        (0, apiResponse_1.SuccessResponse)(res, resultCode_1.default.OK, resultMessage_1.default.DELETE_RESERVATION_SUCCESS, data);
    }
    catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.INTERNAL_SERVER_ERROR, resultMessage_1.default.INTERNAL_SERVER_ERROR);
        return next(err);
    }
});
const deleteCompletedReservation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    const postId = req.params.postId;
    if (postId == ":postId")
        return (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.BAD_REQUEST, resultMessage_1.default.WRONG_PARAMS_OR_NULL);
    try {
        const completedReservation = yield models_1.Reservation.findOne({
            where: {
                id: parseInt(postId),
                user_id: (_g = req.user) === null || _g === void 0 ? void 0 : _g.id,
                completed: true
            }
        });
        if (!completedReservation)
            return (0, apiResponse_1.ErrorResponse)(res, resultCode_1.default.NOT_FOUND, resultMessage_1.default.NO_OR_UNCOMPLETED_RESERVATION);
        yield (completedReservation === null || completedReservation === void 0 ? void 0 : completedReservation.destroy());
        const data = { postId: parseInt(postId) };
        (0, apiResponse_1.SuccessResponse)(res, resultCode_1.default.OK, resultMessage_1.default.DELETE_COMPLETED_RESERVATION_SUCCESS, data);
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