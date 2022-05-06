import Joi from "joi";
import { NextFunction, Request, Response } from "express";
import sc from "../../constant/resultCode";
import rm from "../../constant/resultMessage";
import { ErrorResponse } from "../../modules/apiResponse";
import { SocialType, TokenDto } from "../../interface/dto/request/authRequest";
import { ISetCategory, ISetTime, UserSettingDto } from "../../interface/dto/request/userRequest";
const logger = require("../../api/middlewares/logger");

// fcmtoken optional 로 한거 개맘에 안드는데,,, isLogin 따로 빼면 코드 중복 개쩔거같고,,, 고민
const loginRequestCheck = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {

  const loginParamSchema = Joi.object().keys({
    social: Joi.string().required().valid("apple", "kakao"),
  });
  const loginQuerySchema = Joi.object().keys({
    socialtoken: Joi.string().required(),
<<<<<<< HEAD
    fcmtoken: Joi.string().optional()
=======
    fcmtoken: Joi.string().optional(),
    code: Joi.string().optional()
>>>>>>> feat/apple-login
  });
  
  try {
    // validate 쓰면 error 속성 존재, validateAsync 쓰면 없고 catch error 해줘야함 
    // -> 비동기 최대로 활용 못하는거 같아서 좀 아쉬움
    const paramsError = await loginParamSchema
      .validateAsync(req.params as SocialType)
      .catch(err => { return err; });

    const queryError = await loginQuerySchema
      .validateAsync(req.query as TokenDto)
      .catch(err => { return err; });
      
    if ( paramsError.details || queryError.details) { // ( error 에만 존재하는 detail )
      return ErrorResponse(res, sc.BAD_REQUEST, rm.WRONG_PARAMS_OR_NULL);
    }
    
    next();
        
  } catch (error) {
    console.error(`[VALIDATE ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`);
    logger.appLogger.log({ level: "error", message: error.message}); 
    ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR);  
  }
};


const initRequestCheck = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {

  const setInfoSchema = Joi.object().keys({
    nickname: Joi.string().required().max(10),
    dtype: {
      joke: Joi.boolean().required(),
      compliment: Joi.boolean().required(),
      condolence: Joi.boolean().required(),
      scolding: Joi.boolean().required(),
    },
    time: {
      morning: Joi.boolean().required(),
      afternoon: Joi.boolean().required(),
      night: Joi.boolean().required(),
    }
  });

  try {

    const bodyError = await setInfoSchema
      .validateAsync(req.body as UserSettingDto)
      .catch(err => { return err; });

    if (bodyError.details) {
      return ErrorResponse(res, sc.BAD_REQUEST, rm.WRONG_BODY_OR_NULL);
    }

    next();

  } catch (error) {
    console.error(`[VALIDATE ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`);
    logger.appLogger.log({ level: "error", message: error.message}); 
    ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR);  
  }

}



const timeRequestCheck = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {

  const timeSchema = Joi.object().keys({
    morning: Joi.boolean().required(),
    afternoon: Joi.boolean().required(),
    night: Joi.boolean().required(),
  });

  try {

    const bodyError = await timeSchema
      .validateAsync(req.body as ISetTime)
      .catch(err => { return err; });

    if (bodyError.details) {
      return ErrorResponse(res, sc.BAD_REQUEST, rm.WRONG_BODY_OR_NULL);
    }

    next();

  } catch (error) {
    console.error(`[VALIDATE ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`);
    logger.appLogger.log({ level: "error", message: error.message}); 
    ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR); 
  }

}


const categoryRequestCheck = async(
  req: Request, 
  res: Response, 
  next: NextFunction
) => {

  const categorySchema = Joi.object().keys({
    data: Joi
      .array()
      .length(2)
      .items({
        joke: Joi.boolean().required(),
        compliment: Joi.boolean().required(),
        condolence: Joi.boolean().required(),
        scolding: Joi.boolean().required(),
      }, {
        joke: Joi.boolean().required(),
        compliment: Joi.boolean().required(),
        condolence: Joi.boolean().required(),
        scolding: Joi.boolean().required(),
      })
  });

  try {

    const bodyError = await categorySchema
      .validateAsync(req.body as ISetCategory)
      .catch(err => { return err });
    console.log("🚀", bodyError);
      if (bodyError.details) {
        return ErrorResponse(res, sc.BAD_REQUEST, rm.WRONG_BODY_OR_NULL);
      }

      next();

  } catch(error) {
    console.error(`[VALIDATE ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`);
    logger.appLogger.log({ level: "error", message: error.message}); 
    ErrorResponse(res, sc.INTERNAL_SERVER_ERROR, rm.INTERNAL_SERVER_ERROR); 
  }

}



const validateUtil = {
  loginRequestCheck,
  initRequestCheck,
  timeRequestCheck,
  categoryRequestCheck
}

export default validateUtil;