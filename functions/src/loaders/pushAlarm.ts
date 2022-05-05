import { Item, Time, User, UserCategory, TodayWal } from "../models";
import Queue, { Job } from "bull";
import { Request, Response } from "express";
import admin from "firebase-admin";
import dayjs from "dayjs";
import schedule from 'node-schedule';

const logger = require("../middlewares/logger");


/*
const redisClient=redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password:process.env.REDIS_PASSWORD
});
*/
schedule.scheduleJob('0 0 0 * * *', async () => {
    await TodayWal.destroy();
    await updateTodayWal();

})

async function getRandCategoryNextItem(user: User) {

  const userId = user.getDataValue("id") as number;
  //가진 카테고리 중 하나 선택
  const randomIdx = Math.floor(
    Math.random() * (user.getDataValue("userCategories").length - 1)
  ); 
  const currentItemId = user
    .getDataValue("userCategories")[randomIdx]
    .getDataValue("next_item_id");

  //해당 카테고리의 Table상 id
  const category_id = user
  .getDataValue("userCategories")[randomIdx]
  .getDataValue("category_id");

  const sameCategoryItems = await Item.findAll({
    where: {
      category_id
    }
  }) as Item[];

  const itemValues = sameCategoryItems["dataValues"];
  const item = itemValues.filter((it: Item) => it.id === currentItemId);
  const itemIdx = itemValues.indexOf(item);
  const nextItemId = (itemIdx + 1) % itemValues.length;

  await UserCategory.update({
    next_item_id: nextItemId
  }, {
    where: {
      user_id: userId,
      category_id
    }
  });

  return nextItemId;
  
}

async function updateTodayWal() {
  const users = await User.findAll({
    include: [
      { model: Time, attributes: ["morning", "afternoon", "night"] }, 
      { model: UserCategory, attributes: ["category_id", "next_item_id"] },
    ],
    attributes: ["id"]
  }) as User[];

  for (const user of users) {

    const userId = user.getDataValue("id") as number;

    const selectedTime: Date[] = []
    const times = await Time.findOne({
        where: { user_id : userId }
    }) as Time
    
    const dateString = dayjs(new Date()).format("YYYY-MM-dd")
    if (times["dataValues"]["morning"]) { //8
        selectedTime.push(new Date(`${dateString} 08:00:00`))
        //const walTime = new Date(`${dateString} 08:00:00`)
    }
    if (times["dataValues"]["afternoon"]) { //12
      selectedTime.push(new Date(`${dateString} 12:00:00`))
    }
    if (times["dataValues"]["night"]) { //20
      selectedTime.push(new Date(`${dateString} 20:00:00`))
    }

    for (const t in selectedTime) {
      const nextItemId = await getRandCategoryNextItem(user);

      await TodayWal.create({
        user_id: userId,
        item_id: nextItemId,
        time: t
      })
    }
  }
}

export const messageQueue = new Queue(
  'message-queue1', {
    redis: { 
      host: "redis-16916.c74.us-east-1-4.ec2.cloud.redislabs.com", 
      port: 16916,
      password: "jTurgwWogsvIg1Gt9QiGdWA6q1dXmznh",
      username: "default"
    }
  }
);

// for문 돌려서 정보들 사악 뽑아주기 => 얘를 12시간에 한번씩 실행시켜주면 되지 않을까?
async function extractInfo() {
  const users = await User.findAll({
    include: [
      { model: Time, attributes: ["morning", "afternoon", "night"] }, 
      { model: UserCategory, attributes: ["category_id", "next_item_id"] },
    ],
    attributes: ["id", "fcmtoken"]
  }) as User[];

  for (const user of users) {

    const userId = user.getDataValue("id") as number;
    const randomIdx = Math.floor(
      Math.random() * (user.getDataValue("userCategories").length - 1)
    );
    const currentItemId = user
      .getDataValue("userCategories")[randomIdx]
      .getDataValue("next_item_id");

    const sameCategoryItems = await Item.findAll({
      where: {
        category_id: user
          .getDataValue("userCategories")[randomIdx]
          .getDataValue("category_id")
      }
    }) as Item[];

    const itemValues = sameCategoryItems["dataValues"];
    const item = itemValues.filter((it: Item) => it.id === currentItemId);
    const itemIdx = itemValues.indexOf(item);
    const nextItemId = (itemIdx + 1) % itemValues.length;
    await UserCategory.update({
      next_item_id: nextItemId
    }, {
      where: {
        user_id: userId
      }
    });

    const fcmToken = user.getDataValue("fcmtoken");
    const messageContent = await Item.findOne({ where: { id: currentItemId } });
    const data = {
      fcmToken,
      messageContent
    }

    const selectedTime: number[] = []
    const times = await Time.findOne({
        where: { user_id : userId }
    }) as Time

    if (times["dataValues"]["morning"]) { 
        selectedTime.push(12)
    }
    if (times["dataValues"]["afternoon"]) { 
      selectedTime.push(14)
    }
    if (times["dataValues"]["night"]) {
      selectedTime.push(20)
    }

    for (const t in selectedTime) {
        sendMessage(data, t)
    }

  }


}



async function messageProcess (job: Job) { // fcm, contents 꺼내서 메세지 보내주기
    // messageQueue.add 로 추가해준 작업
    // messageQueue.process 로 실행
    const deviceToken = job.data.fcmtoken;
    let message = { 
        notification: { 
            title: '테스트 발송💛', 
            body: job.data.content, // 카테고리 아이디로 item 에서 content 뽑아서 여기다 ㅇㅇ
        }, 
        token: deviceToken, 
    }

}
  

const messageToUser = (req: Request, res: Response, message) => {
  admin 
      .messaging() 
      .send(message) 
      .then(function (response) { 
          console.log('Successfully sent message: : ', response) 
          return res.status(200).json({success : true}) 
      }) 
      .catch(function (err) { 
          console.log('Error Sending message!!! : ', err) 
          return res.status(400).json({success : false}) 
      });
}


messageQueue.process(messageProcess);





export async function sendMessage(data, time): Promise<void> {

  try {

    await messageQueue.add(
      data, 
      {
        repeat: { cron: `* ${time} * * *` }
      });

  } catch(error) {
    logger.appLogger.log({
      level: "error",
      message: error.message
    })
  }

}