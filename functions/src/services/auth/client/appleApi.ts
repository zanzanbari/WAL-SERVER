import jwt from "jsonwebtoken";
import qs from "qs";
import { IApplePublicKeys, IAppleUserInfo, Token } from "../../../interface/dto/response/authResponse";
import axios from "axios";
const logger = require("../../../api/middlewares/logger");

// apple public key 가져오는 함수
export async function getPublicKey(): Promise<IApplePublicKeys> {

    try {

        const keys: IApplePublicKeys = await axios.get("https://appleid.apple.com/auth/keys")
            .then(resolve => { return resolve.data["keys"] })
            .catch(err => { return err });

        return keys;
        
    } catch (error) {
        logger.appLogger.log({
            level: "error",
            message: error.message
        });
        throw new Error(error.message);
    }

}


const appleApiUtil = {
    getPublicKey
};

export default appleApiUtil;