import Discord = require("discord.js");
import * as config from "../config.json";
import CommandMap from "./responses";
import { Quiz } from "./game";
import db from "./database";

import { parse } from "discord-command-parser";
require("dotenv/config");

const token = process.env.TOKEN;

const bot = new Discord.Client();

export interface ClientState {
  quiz: Quiz;
}

const state: ClientState = {
  quiz: new Quiz(bot),
};

bot.on("ready", () => {
  console.log(`Logged in as ${bot.user.tag} !`);
});

bot.on("message", (msg) => {
  if (msg.content[0] == config.prefix) {
    const parsed = parse(msg, config.prefix);

    if (parsed.success) {
      const callback = CommandMap.get(parsed.command);
      if (callback) {
        callback(msg, state, parsed.arguments);
      }
    }
  }
});

bot.on("guildCreate", (gData) => {
  db.collection("guilds")
    .doc(gData.id)
    .set({
      id: gData.id,
      name: gData.name,
      ownerName: gData.owner ? gData.owner.user.username : "unknown",
      ownerId: gData.ownerID,
      prefix: config.prefix,
    });
});

bot.login(token);
