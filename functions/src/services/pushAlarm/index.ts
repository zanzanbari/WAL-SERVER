import { Item, Time, User, UserCategory, TodayWal } from "../../models";
import Queue, { Job } from "bull";
import dayjs from "dayjs";
import schedule from 'node-schedule';

const logger = require("../../api/middlewares/logger");

export const morningQueue = new Queue(
  'morning-queue', {
    redis: { 
      host: "localhost", 
      port: 6379
    }
  }
);

export const afternoonQueue = new Queue(
  'afternoon-queue', {
    redis: { 
      host: "localhost", 
      port: 6379
    }
  }
);

export const nightQueue = new Queue(
  'night-queue', {
    redis: { 
      host: "localhost", 
      port: 6379
    }
  }
);

export const messageQueue = new Queue(
    'message-queue', {
      redis: { 
        host: "localhost", 
        port: 6379
      }
    }
  );

export function updateToday() {
    schedule.scheduleJob('0 0 0 * * *', async () => {
        await TodayWal.destroy({
            where: {},
            truncate: true
        });
        await updateTodayWal();
  });
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

        const times = user.getDataValue("times");
        const dateString = dayjs(new Date()).format("YYYY-MM-dd")
        if (times["dataValues"]["morning"]) { //8
            selectedTime.push(new Date(`${dateString} 08:00:00`))
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