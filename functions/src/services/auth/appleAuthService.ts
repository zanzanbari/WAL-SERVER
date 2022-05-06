import jwt from "jsonwebtoken";
import IAuthService from "./authService";
import appleApiUtil, { appleAuthApi } from "./client/appleApi";
import { TokenDto } from "../../interface/dto/request/authRequest";
import { AuthResponse, IAppleUserInfo, Token } from "../../interface/dto/response/authResponse";
import { issueAccessToken, issueRefreshToken } from "../../modules/tokenHandller";

class AppleAuthService implements IAuthService {
    constructor(
        private readonly userRepository: any,
        private readonly logger: any
    ) {
    }
    
    public async login(request: TokenDto): Promise<AuthResponse | undefined> {
      
      try {
        // 결국 해야되는건 -> id_token 받아서 
        // apple server 공개 키로 jwt 해독
        const data = await appleApiUtil.getPublicKey();
        console.log("-----------");
        console.log("publicKey : ", data);
        console.log("-----------");


        const userData = await appleAuthApi(request.socialtoken as string);
        
        console.log("-----------");
        console.log("userData : ", userData);
        console.log("-----------");

        const refreshtoken = await issueRefreshToken();

        console.log("-----------");
        console.log("refreshtoken : ", refreshtoken);
        console.log("-----------");

        const socialUser = await this.userRepository.findByEmailOrCreateSocialUser("kakao", userData, request, refreshtoken);

        console.log("-----------");
        console.log("socialUser : ", socialUser);
        console.log("-----------");
        const accesstoken = await issueAccessToken(socialUser);

        console.log("-----------");
        console.log("accesstoken : ", accesstoken);
        console.log("-----------");

        const user: AuthResponse = {
          nickname: socialUser.nickname,
          accesstoken,
          refreshtoken
        }
        return user;
        
      } catch (error) {
        console.error(error);
        this.logger.appLogger.log({
          level: "error",
          message: error.message
        });
        throw new Error(error);
      }
      
    }
    
    resign(userId: number, token: TokenDto): Promise<any> {
      throw new Error("Method not implemented.");
    }


  }
  
  export default AppleAuthService;