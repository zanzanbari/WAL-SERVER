import jwt from "jsonwebtoken";
import qs from "qs";
import { IAppleUserInfo, Token } from "../../../interface/dto/response/authResponse";
import axios from "axios";
const logger = require("../../../api/middlewares/logger");


export async function getPublicKey() {

    try {

        const keys = await axios.get("https://appleid.apple.com/auth/keys");
        return keys;
        
    } catch (error) {
        logger.appLogger.log({
            level: "error",
            message: error.message
        });
        throw new Error(error.message);
    }

}


export async function appleAuthApi(id_token: string) {

    try {



    } catch (error) {
        logger.appLogger.log({
            level: "error",
            message: error.message
        });
        throw new Error(error.message);
    }
}


const appleApiUtil = {
    getPublicKey,
    appleAuthApi
};

export default appleApiUtil;