import { Time } from "../../models";
import { morningQueue, afternoonQueue, nightQueue } from './';

const logger = require("../../api/middlewares/logger");


export async function addUserTime(userId): Promise<void> {

    try {
        //user id를 data로 전달
        const times = await Time.findOne({
            where: { user_id : userId }
        }) as Time

        if (times.morning) {
            await morningQueue.add(
                userId,
                {
                repeat: { cron: `* 8 * * *` }
                });
        } 
        if (times.afternoon) {
            await afternoonQueue.add(
                userId,
                {
                repeat: { cron: `* 12 * * *` }
                });
        } 
        if (times.night) {
            await nightQueue.add(
                userId,
                {
                repeat: { cron: `* 20 * * *` }
                });
            }
            
    } catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
    }
    
}
