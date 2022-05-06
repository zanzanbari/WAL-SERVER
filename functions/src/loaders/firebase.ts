import admin, { app } from "firebase-admin";
const serviceAccount = require("../../key/firebase-admin.json")
const logger = require("../api/middlewares/logger");

//initialize firebase inorder to access its services
export const initFirebase = () => {

  let firebase: app.App;
  try {

    if (admin.apps.length === 0) {
      firebase = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      firebase = admin.app();
    }

  } catch (error) {
    logger.appLogger.log({ level: "error", message: error.message });
    throw new Error(error.message);
  }
}
