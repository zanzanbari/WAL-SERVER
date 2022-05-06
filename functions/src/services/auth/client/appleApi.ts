import jwt from "jsonwebtoken";
import qs from "qs";
import { issueAppleClientSecret } from "../../../modules/tokenHandller";
import { IAppleUserInfo, Token } from "../../../interface/dto/response/authResponse";
import axios from "axios";
const logger = require("../../../api/middlewares/logger");



export async function appleAuthApi(code: string, clientId: string) {
    // 인가 코드의 유효성 검증하고 토큰 받아오기
    const apiUrl = "https://appleid.apple.com/auth/token";
    const queryString = qs.stringify({
        client_id: clientId,
        client_secret: issueAppleClientSecret(clientId),
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.APPLE_REDIRECT_URI,
    });
    const reqConfig = {
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        }
    };

    try {

        const result = await axios.post(apiUrl, queryString, reqConfig)
            .then(resolve => {
                console.log("-----------");
                console.log("resolve.data : ", resolve.data);
                console.log("-----------");
                return resolve.data
            })
            .catch(err => { return err });
        
        console.log("-----------");
        console.log("result : ", result);
        console.log("-----------");

        if ("id_token" in result) {
            const { email } = jwt.decode(result["id_token"]) as IAppleUserInfo;
            const nickname = null;
            return { email, nickname };
        }

    } catch (error) {
        logger.appLogger.log({
            level: "error",
            message: error.message
        });
        throw new Error(error.message);
    }
}