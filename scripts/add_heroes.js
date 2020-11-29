const serviceAccount = require("../service-account.json");
const heroesList = require("./all_heroes.json");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cstriviabot.firebaseio.com",
});

const db = admin.firestore();
const heroDB = db.collection("heroes");

for (let i = 0; i < heroesList.length; i++) {
  const hero = heroesList[i];
  console.log(hero);
  heroDB.doc("hero_id_" + i).set({
    name: hero.name || "Missing",
    gender: hero.appearance.gender || "unknown",
    race: hero.appearance.race || "unknown",
    alignment: hero.alignment || "unknown",
    image: hero.images.lg || "image unavaible",
    work: hero.work.occupation || hero.work.base || "-",
  });
}
