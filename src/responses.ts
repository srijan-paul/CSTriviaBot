import Discord = require("discord.js");
import { commands, prefix } from "../config.json";
import { ClientState } from "./index";
import vm = require("vm");

export type Response = (
  msg: Discord.Message,
  state: ClientState,
  ...args: string[]
) => void;

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

const answer: Response = (msg, state) => {
  let answer: string = msg.content.split(" ")[1];
  let result = state.quiz.checkAnswer(answer, msg.author);

  if (result) return;
  msg.channel.send("There is no ongoing quiz.");
};

/**
 * 
 * @param msg message object.
 */

const interpretJS: Response = msg => {
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
        args.forEach(e => (out += e));
        out += "\n";
      },
    },
  };

  try {
    vm.runInContext(code, vm.createContext(context), { timeout: 50 });
    msg.channel.send(
      `\`\`\`${out.length < 200
        ? out.toString()
        : out.substr(0, 200) + "... (log hidden)"}\`\`\``
    );
    msg.react("\u2705");
  } catch (e) {
    msg.react("\u274C");
    msg.channel.send(e.toString());
  }
};

const CommandMap: Map<string, Response> = new Map([
  // prettier-ignore
  [commands.start, startQuiz],
  [commands.stop, stopQuiz],
  [commands.answer, answer],
  [commands.js, interpretJS],
]);

export default CommandMap;
