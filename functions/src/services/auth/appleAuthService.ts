import IAuthService from "./authService";
import { appleAuthApi } from "./client/appleApi";
import { TokenDto } from "../../interface/dto/request/authRequest";
import { AuthResponse, Token } from "../../interface/dto/response/authResponse";
import { issueAccessToken, issueRefreshToken } from "../../modules/tokenHandller";

class AppleAuthService implements IAuthService {
    constructor(
        private readonly userRepository: any,
        private readonly logger: any
    ) {
    }
    
    public async login(request: TokenDto) {
      
      try {

        
        
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