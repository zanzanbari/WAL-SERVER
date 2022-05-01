import { NextFunction, Request, Response } from "express";
import { Item, Time, User, UserCategory, Reservation } from "../../models";
import { Op } from "sequelize";
import { ErrorResponse, SuccessResponse } from "../../modules/apiResponse";
import sc from "../../constant/resultCode";
import rm from "../../constant/resultMessage";
import Error from "../../constant/responseError";
//import {  } from "../../interface/dto/request/reserveRequest";
//import {  } from "../../interface/dto/response/reserveResponse";
import ReserveService from "../../services/user/userService";
const logger = require("../middlewares/logger");
import dayjs from "dayjs";
import sequelize from "../../models";

const dayArr = ["(일)","(월)","(화)","(수)","(목)","(금)","(토)"];

const getHistoryDateMessage = (
    rawDate: Date
) => {
    try {

        const monthDate = dayjs(rawDate).format("MM. DD") as string;
        let time = dayjs(rawDate).format(":mm") as string;
        
        if (dayjs(rawDate).hour() >= 12) {
            time = ` 오후 ${dayjs(rawDate).hour() - 12}` + time;
        } else {
            time = ` 오전 ${dayjs(rawDate).hour()}` + time;
        }
        
        const day = dayArr[dayjs(rawDate).day()] as string;

        return {
            monthDate,
            day,
            time
        }

    } catch (err){
        console.log(err)
    }

}

const getReservation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {

        const sendingData : any[] = [], completeData : any[] = [];

        const data = {
            sendingData,
            completeData
        };

        const sendingDataItems = await Reservation.findAll({
            where: {
                user_id: req.user?.id,
                completed: false
            },
            order: [
                ["reservedAt", "DESC"],
                ["sendingDate", "DESC"]
            ] //보낸 날짜 desc정렬
        }) as Reservation[];

        const completeDataItems = await Reservation.findAll({
            where: {
                user_id: req.user?.id,
                completed: true
            },
            order: [
                ["sendingDate", "DESC"]
            ] //받은 날짜 desc정렬
        }) as Reservation[];

        if (sendingDataItems.length < 1 && completeDataItems.length < 1) {
            SuccessResponse(res, sc.OK, rm.NO_RESERVATION, data);
        }

        for (const item of sendingDataItems) {
            const rawDate = item.getDataValue("sendingDate") as Date;
            const historyMessage = getHistoryDateMessage(rawDate);
            const sendingDate = historyMessage?.monthDate + " " + historyMessage?.day + historyMessage?.time + " • 전송 예정"
            sendingData.push({
                postId: item.id,
                sendingDate,
                content: item.getDataValue("content"),
                reservedAt: dayjs(item.getDataValue("reservedAt")).format("YYYY. MM. DD"),
                hidden: item.getDataValue("hide")
            });
        }

        for (const item of completeDataItems) {
            const rawDate = item.getDataValue("sendingDate") as Date;
            const historyMessage = getHistoryDateMessage(rawDate);
            const sendingDate = historyMessage?.monthDate + " " + historyMessage?.day + historyMessage?.time + " • 전송 완료"
            completeData.push({
                postId: item.id,
                sendingDate,
                content: item.getDataValue("content"),
                reservedAt: dayjs(item.getDataValue("reservedAt")).format("YYYY. MM. DD")
            });
        }
        
        SuccessResponse(res, sc.OK, rm.READ_RESERVATIONS_SUCCESS, data);
       

    } catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR);
        return next(err);
    }
}


const postReservation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        
        const {
            content,
            hide,
            date,
            time
        } = req.body;

        if (!content || hide == undefined || !date || !time) return ErrorResponse(res, sc.BAD_REQUEST, rm.NULL_VALUE);

        const existingReservation = await Reservation.findOne({
            where: {
                user_id: req.user?.id,
                $and: sequelize.where(sequelize.fn('date', sequelize.col('sendingDate')), '=', new Date(date))
            
        }})

        if (existingReservation) return ErrorResponse(res, sc.BAD_REQUEST, rm.INVALID_RESERVATION_DATE);

     
        const newReservation = await Reservation.create({
            user_id: req.user?.id,
            sendingDate: new Date(`${date} ${time}`),
            hide,
            content
        });

        const data = { postId: newReservation.id };

        /**
         * -----------------------------알림 보내는 기능 넣어야 한다 ---------------------------
         * 
         */
        SuccessResponse(res, sc.OK, rm.ADD_RESERVATION_SUCCESS, data);


    } catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR);
        return next(err);
    }
}


const getReservedDate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const date = [] as string[];
        const data = { date }
        const today = new Date();

        const reservedDateItems = await Reservation.findAll({
            where: {
                user_id: req.user?.id,
                sendingDate: {
                    [Op.gt]: today
                }
            },
            attributes: ["sendingDate"]
        }) as Reservation[];

        if (reservedDateItems.length < 1) {
            SuccessResponse(res, sc.OK, rm.NO_RESERVATION_DATE, data);
        }

        for (const item of reservedDateItems) {
            const reservedDate = item.getDataValue("sendingDate") as Date;
            date.push(dayjs(reservedDate).format("YYYY-MM-DD"));
        }

        data.date = date.sort();


        SuccessResponse(res, sc.OK, rm.READ_RESERVED_DATE_SUCCESS, data);
   

    } catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR);
        return next(err);
    }
}

const deleteReservation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const postId = req.params.postId;
    if (postId == ":postId")
        return ErrorResponse(res, sc.BAD_REQUEST, rm.WRONG_PARAMS_OR_NULL);

    try {

        const waitingReservation = await Reservation.findOne({ 
            where: { 
                id: parseInt(postId),
                user_id: req.user?.id,
                completed: false
            } 
        });

        if (!waitingReservation)
            return ErrorResponse(res, sc.NOT_FOUND, rm.NO_OR_COMPLETED_RESERVATION);
        
        /** 
         * -------------------------------
            schedule에서 해당 reservation 삭제!!!!!!!!!!!!!!!!!
            -------------------------------
        **/

        await waitingReservation?.destroy();

        const data = { postId: parseInt(postId) }
        SuccessResponse(res, sc.OK, rm.DELETE_RESERVATION_SUCCESS, data);


    } catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR);
        return next(err);
    }
}

const deleteCompletedReservation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const postId = req.params.postId;
    if (postId == ":postId")
        return ErrorResponse(res, sc.BAD_REQUEST, rm.WRONG_PARAMS_OR_NULL);

    try {

        const completedReservation = await Reservation.findOne({ 
            where: { 
                id: parseInt(postId),
                user_id: req.user?.id,
                completed: true
            } 
        });

        if (!completedReservation)
            return ErrorResponse(res, sc.NOT_FOUND, rm.NO_OR_UNCOMPLETED_RESERVATION);
        
        await completedReservation?.destroy();

        const data = { postId: parseInt(postId) }
        SuccessResponse(res, sc.OK, rm.DELETE_COMPLETED_RESERVATION_SUCCESS, data);

    } catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
        ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR);
        return next(err);
    }
}


export const reserveController = {
    getReservation,
    postReservation,
    getReservedDate,
    deleteReservation,
    deleteCompletedReservation
}