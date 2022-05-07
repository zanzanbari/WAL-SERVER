import { Item, Time, User, UserCategory, TodayWal, Reservation } from "../../models";
import { morningQueue, afternoonQueue, nightQueue, messageQueue } from './';
import { Job } from "bull";
import dayjs from "dayjs";

const logger = require("../../api/middlewares/logger");

async function getTokenMessage(time: Date, userId: number) {

    try {

        const wal = await TodayWal.findOne({
            where: { time, user_id: userId },
            include: [
              { model: User, attributes: ["fcmtoken"] }
            ]
          });
      
          const fcmtoken = wal?.getDataValue("users").getDataValue("fcmtoken");
          const userDefined = wal?.getDataValue("userDefined");
          let content:string|undefined = "";
          if (userDefined) {
              const reservation = await Reservation.findOne({where: {id: wal?.getDataValue("reservation_id")}})
              content = reservation?.content;
          } else {
              const item = await Item.findOne({where: {id: wal?.getDataValue("item_id")}})
              content = item?.content;
          }
        
          const data = {
              fcmtoken,
              content
          };

          return data;

    } catch (err) {
        logger.appLogger.log({ level: "error", message: err.message });
    }
    
}

morningQueue.process(async (job: Job) => {
	const {userId} = job.data;
	//userId-> FCM, 랜덤 카테고리에서 다음 메시지 가져옴
	//data : { fcm, content }
    const dateString = dayjs(new Date()).format("YYYY-MM-dd")
    const data = await getTokenMessage(new Date(`${dateString} 08:00:00`), userId);

	messageQueue.add(data, { //message를 보내는 작업, 5번 시도
		attempts: 5
	});
});

afternoonQueue.process(async (job: Job) => {
	const {userId} = job.data;

    const dateString = dayjs(new Date()).format("YYYY-MM-dd")
    const data = await getTokenMessage(new Date(`${dateString} 12:00:00`), userId);

	messageQueue.add(data, { //message를 보내는 작업, 5번 시도
		attempts: 5
	});
});


nightQueue.process(async (job: Job) => {
	const {userId} = job.data;

    const dateString = dayjs(new Date()).format("YYYY-MM-dd")
    const data = await getTokenMessage(new Date(`${dateString} 20:00:00`), userId);

	messageQueue.add(data, { //message를 보내는 작업, 5번 시도
		attempts: 5
	});
});