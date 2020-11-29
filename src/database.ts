import firebase = require("firebase/app");
import admin = require("firebase-admin");
import serviceAccount = require("../service-account.json");
import Discord = require("discord.js");

// connect to firebase database
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cstriviabot.firebaseio.com",
});

const db = admin.firestore();

export default db;
export const userDB = db.collection("user");
export const heroDB = db.collection("heroes");

export function findUserById(
  id: string,
  callback: (
    user: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  ) => void
) {
  userDB
    .where("id", "==", id)
    .get()
    .then((snapshot) => {
      const userData = snapshot.docs[0];
      callback(userData || null);
    });
}

export function addUserToDB(user: Discord.User, status = "user") {
  return userDB.add({
    name: user.username,
    description: "commoner",
    id: user.id,
    reputation: 0,
    status,
  });
}

export function findHeroByName(
  name: string,
  callback: (
    user: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  ) => void
) {
  heroDB
    .where("name", "==", name)
    .get()
    .then((snapshot) => {
      const data = snapshot.docs[0];
      callback(data || null);
    });
}
