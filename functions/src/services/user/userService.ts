import { Service } from "typedi";
import { 
    ResetCategoryDto,
    ISetUserCategory, 
    UserSettingDto, 
    ISetCategory} from "../../interface/dto/request/userRequest";
import { UserSettingResponse } from "../../interface/dto/response/userResponse";


@Service()
class UserService {

    private infoToUserCategoryDB!: ISetUserCategory;
    private categorySelection: ISetCategory = {
        joke: false,
        compliment: false,
        condolence: false,
        scolding: false
    };

    constructor(
        private readonly userRepository: any,
        private readonly timeRepository: any,
        private readonly itemRepository: any,
        private readonly userCategoryRepository: any,
        private readonly logger: any
    ) {
    }

        
    public async initSetInfo(
        userId: number, 
        request: UserSettingDto
    ): Promise<UserSettingResponse> {

        try {            
            // 유형 선택
            // 각각 T/F 뽑아서 => T면 새로운 배열에 그 인덱스 번호 넣어, F면 넣지마
            const dtypeBoolInfo = this.extractBooleanInfo(request.dtype as ISetCategory);

            const dtypeIdx: number[] = [];

            dtypeBoolInfo.forEach(it => {
                if (it === true) {
                    dtypeIdx.push(dtypeBoolInfo.indexOf(it))
                }
            });

            dtypeIdx.forEach(async categoryId => {

                const firstItemId = await this.itemRepository.getFirstIdEachOfCategory(categoryId) as number;
                this.infoToUserCategoryDB = {
                    user_id: userId,
                    category_id: categoryId,
                    next_item_id: firstItemId,
                };
                await this.userCategoryRepository.setUserCategory(this.infoToUserCategoryDB); 
                
            });

            await this.timeRepository.setTime(userId, request.time);
            await this.userRepository.setNickname(userId, request.nickname);

            return { nickname: request.nickname };

        } catch (error) {
            this.logger.appLogger.log({
                level: "error",
                message: error.message
            });
            throw new Error(error);
        }
        
    }



    public async getCategoryInfo(userId: number): Promise<ISetCategory> {

        try {

            const dtypeInfo = this.userCategoryRepository.findCategoryByUserId(userId) as Promise<string[]>;
            this.setCategoryInfo(await dtypeInfo);

            return this.categorySelection;

        } catch (error) {
            this.logger.appLogger.log({
                level: "error",
                message: error.message
            });
            throw new Error(error);
        }
    }



    public async resetUserCategoryInfo(
        userId: number,
        request: ResetCategoryDto
    ): Promise<ISetCategory> {

        try { 

            const beforeCategoryInfo = request[0]; // 이전 설정값
            const afterCategoryInfo = request[1]; // 새로운 설정값

            const before = this.extractBooleanInfo(beforeCategoryInfo);
            const after = this.extractBooleanInfo(afterCategoryInfo);

            for (let categoryId = 0 ; categoryId < 4; categoryId ++) {

                if (before[categoryId] === true && after[categoryId] === false) { // 삭제

                    await this.userCategoryRepository.deleteUserCategory(userId, categoryId);

                } else if (before[categoryId] === false && after[categoryId] === true) { // 생성

                    const firstItemId = await this.itemRepository.getFirstIdEachOfCategory(categoryId) as number;
                    this.infoToUserCategoryDB = {
                        user_id: userId,
                        category_id: categoryId,
                        next_item_id: firstItemId,
                    };
                    await this.userCategoryRepository.setUserCategory(this.infoToUserCategoryDB); 

                }

            }

            const dtypeInfo = this.userCategoryRepository.findCategoryByUserId(userId) as Promise<string[]>;
            this.setCategoryInfo(await dtypeInfo);
            
            return this.categorySelection;

        } catch (error) {
            this.logger.appLogger.log({
                level: "error",
                message: error.message
            });
            throw new Error(error);
        }

    }


    private extractBooleanInfo(property: ISetCategory): boolean[] {
        const extractedInfo: boolean[] = [];
        for (const key in property) { // 객체 탐색 for...in
            extractedInfo.push(property[key]);
        }
        return extractedInfo;
    }

    private setCategoryInfo(data: string[]): void {
        data.forEach(it => {
            if (it === "joke") this.categorySelection.joke = true;
            if (it === "compliment") this.categorySelection.compliment = true;
            if (it === "condolence") this.categorySelection.condolence = true;
            if (it === "scolding") this.categorySelection.scolding = true;
        });
    }

}



export default UserService;