import Discord = require("discord.js");
import { commands, prefix, ballAnswers } from "../config.json";
import { ClientState } from "./index";
import vm = require("vm");
import * as util from "./helpers";
import axios = require("axios");
import { addUserToDB, findHeroByName, findUserById } from "./database";
import Axios from "axios";

export type Response = (
  msg: Discord.Message,
  state: ClientState,
  args: string[]
) => void;

type DiscordChannel =
  | Discord.TextChannel
  | Discord.DMChannel
  | Discord.NewsChannel;

const startQuiz: Response = (msg, state) => {
  let quizStarted = state.quiz.start(msg.channel);

  if (!quizStarted) {
    msg.channel.send(
      "A quiz game is already going on. To start a fresh one, use `?stop` to stop the current session."
    );
    return;
  }

  msg.channel.send("starting quiz");
};

const stopQuiz: Response = (msg, state) => {
  let result = state.quiz.stop(msg.channel);

  if (!result) {
    msg.channel.send("There is no ongoing quiz.");
    return;
  }

  msg.channel.send("Quiz stopped.");
};

const answer: Response = (msg, state, args) => {
  let answer: string = args[0];
  let result = state.quiz.checkAnswer(answer, msg.author);

  if (result) return;
  msg.channel.send("There is no ongoing quiz.");
};

/**
 *
 * @param msg message object.
 */

const interpretJS: Response = (msg) => {
  const text = msg.content;
  let start = text.indexOf("```") + 3;
  const end = text.lastIndexOf("```");

  if (start == -1 || start - 3 == end) {
    msg.channel.send(
      "Did not find any code to run. use `js` command followed by your code wrapped in \\`\\`\\` to interpret it and see the result."
    );
    return;
  }

  // syntax highlight
  if (text.substr(start, 2) == "js") start += 2;

  const code = text.substring(start, end);

  let out = "";

  const context = {
    console: {
      log(...args: any[]) {
        args.forEach((e) => (out += e));
        out += "\n";
      },
    },
  };

  try {
    vm.runInContext(code, vm.createContext(context), { timeout: 50 });
    msg.channel.send(
      `\`\`\`${
        out.length < 200
          ? out.toString()
          : out.substr(0, 200) + "... (log hidden)"
      }\`\`\``
    );
    msg.react("\u2705");
  } catch (e) {
    msg.react("\u274C");
    msg.channel.send(e.toString());
  }
};

const userInfo: Response = async (msg, state, args) => {
  let user = msg.mentions.users.first();
  if (!user) user = msg.author;

  findUserById(user.id, (userData) => {
    const description = userData?.get("description") || "commoner.";
    const rep = userData?.get("reputation") || 0;

    const embedMessage = util.makeEmbed({
      title: user.username,
      description: description,
      author: { name: "User Info" },
      fields: [
        {
          name: "id",
          value: user.id,
          inline: true,
        },
        {
          name: "reputation",
          value: rep,
          inline: true,
        },
      ],
      imageURL: user.displayAvatarURL(),
    });

    msg.channel.send(embedMessage);
  });
};

const eightBall: Response = (msg) => {
  const answer = ballAnswers[Math.floor(Math.random() * ballAnswers.length)];
  msg.channel.send(answer);
};

const setRep = (msg, amount: number) => {
  const user = msg.mentions.users.first();
  if (!user) {
    msg.channel.send("Use: `?rep @user`.");
    return;
  } else if (user.id == msg.author.id) {
    msg.channel.send("Can't give reputation to self. ;)");
    return;
  }

  findUserById(user.id, (userData) => {
    let rep = amount;
    if (userData && userData.exists) {
      rep = userData.get("reputation") + amount;
      userData.ref.update({ reputation: rep });
    } else {
      addUserToDB(user).then((ref) => ref.update({ reputation: rep }));
    }

    msg.channel.send(
      `Gave ${amount} reputation to ${user.username}. Total reputation: ${rep}.`
    );
  });
};

const addRep = (msg) => setRep(msg, 1);
const takeRep = (msg) => setRep(msg, -1);

function sendResponseURL(channel: DiscordChannel, url: string) {
  Axios.get(url).then((res) => {
    if (res.status != 200) return;
    channel.send(res.data.url);
  });
}

const dogImage: Response = (msg) =>
  sendResponseURL(msg.channel, "https://random.dog/woof.json");

const catImage: Response = (msg) => {
  Axios.get("https://api.thecatapi.com/v1/images/search").then((res) => {
    if (res.status != 200) return;
    msg.channel.send(res.data[0].url);
  });
};

function makeHeroEmbed(
  hero: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
) {
  const fieldNames = ["name", "gender", "race", "alignment"];
  let fields = [];
  for (const name of fieldNames) {
    fields.push({
      name: name,
      value: hero.get(name),
    });
  }

  return util.makeEmbed({
    title: hero.get("name"),
    description: hero.get("work"),
    author: { name: hero.get("name") },
    fields: fields,
    imageURL: hero.get("image"),
  });
}

const heroSearch: Response = (msg, state, args) => {
  const heroName = args[0];
  if (!heroName) {
    msg.channel.send(
      'Use: `?hero HeroName` for single word names and `?hero "Hero Name" for longer names with spaces.'
    );
    return;
  }

  findHeroByName(heroName, (heroData) => {
    if (heroData && heroData.exists) {
      const embed = makeHeroEmbed(heroData);
      msg.channel.send(embed);
    } else {
      msg.channel.send(
        `Unknown hero "${heroName}". Try using proper casing for the name. e.g- "Abin Sur" instead of "abin sur" `
      );
    }
  });
};

const CommandMap: Map<string, Response> = new Map([
  // prettier-ignore
  [commands.start, startQuiz],
  [commands.stop, stopQuiz],
  [commands.answer, answer],
  [commands.js, interpretJS],
  ["ping", (msg) => msg.channel.send("pong")],
  [commands.info, userInfo],
  [commands.eightBall, eightBall],
  [commands.rep, addRep],
  [commands.negrep, takeRep],
  [commands.randomDog, dogImage],
  [commands.randomCat, catImage],
  [commands.heroSearch, heroSearch],
]);

export default CommandMap;
