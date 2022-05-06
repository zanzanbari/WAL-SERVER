import jwt from "jsonwebtoken";
import IAuthService from "./authService";
import { appleAuthApi } from "./client/appleApi";
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
        
        const { aud: clientId } = jwt.decode(request.socialtoken) as IAppleUserInfo;
        console.log("-----------");
        console.log("client_id : ", clientId);
        console.log("-----------");
        const userData = await appleAuthApi(request.code as string, clientId as string);
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