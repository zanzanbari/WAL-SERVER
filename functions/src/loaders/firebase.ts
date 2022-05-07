import * as admin from "firebase-admin";
const serviceAccount = require("../../key/firebase-admin.json");


//initialize firebase inorder to access its services
export const initFirebase = () => {

  let firebase: admin.app.App;
  if (admin.apps.length === 0) {
  
    firebase = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  
  } else {
    firebase = admin.app();
  }

}
