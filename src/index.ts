import Discord = require("discord.js");
import { token } from "../token.json";
import * as config from "../config.json";
import CommandMap from "./responses";
import { Quiz, GameState } from "./game";

const client = new Discord.Client();

export interface ClientState {
  quiz: Quiz;
}

const state: ClientState = {
  quiz: new Quiz(client),
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag} !`);
});

client.on("message", msg => {
  if (msg.content[0] == config.prefix) {
    const content = msg.content;

    let end = content.indexOf(" ");

    if (end == -1) {
      end = content.length;
    }

    const command = content.substring(1, end);

    const callback = CommandMap.get(command);

    if (callback) {
      callback(msg, state);
    }
  }
});

client.login(token);
