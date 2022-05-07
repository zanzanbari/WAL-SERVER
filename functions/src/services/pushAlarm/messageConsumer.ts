import { Item, Time, User, UserCategory, TodayWal, Reservation } from "../../models";
import { messageQueue } from './';
import { Job } from "bull";
import admin from "firebase-admin";

const logger = require("../../api/middlewares/logger");

messageQueue.process(async (job: Job) => {
	const { fcmtoken, content } = job.data;

    let message = { 
        notification: { 
            title: '왈소리 와써💛', 
            body: content,
        }, 
        token: fcmtoken, 
    }

    admin 
      .messaging() 
      .send(message) 
      .then(function (response) { 
          console.log('Successfully sent message: : ', response)
          logger.appLogger.log({ level: "info", message: response });
      }) 
      .catch(function (err) { 
          console.log('Error Sending message!!! : ', err)
          logger.appLogger.log({ level: "error", message: err.message });
      });

});