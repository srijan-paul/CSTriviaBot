import Discord = require("discord.js");
import { commands, prefix } from "../config.json";
import { ClientState } from "./index";

const url = "https://opentdb.com/api.php?amount=10&category=18&difficulty=easy";
const token = "t1";

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

const CommandMap: Map<string, Response> = new Map([
  // prettier-ignore
  [commands.start, startQuiz],
  [commands.stop, stopQuiz],
  [commands.answer, answer],
]);

export default CommandMap;
