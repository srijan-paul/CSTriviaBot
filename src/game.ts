import {
  Client,
  Message,
  TextChannel,
  DMChannel,
  NewsChannel,
  User,
} from "discord.js";

import * as Util from "./helpers";
import * as config from "../config.json";
import fetch = require("node-fetch");
import DataStore = require("nedb");

type Channel = TextChannel | DMChannel | NewsChannel;

export enum GameState {
  PLAYING,
  STOPPED,
  AWAITING_ANS,
}

enum QuestionType {
  MULTIPLE_CHOICE,
  TRUE_OR_FALSE,
  ANSWER,
  UKNOWN,
}

interface Question {
  content: string;
  type: QuestionType;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  options: {
    [0]: string;
    [1]: string;
    [2]?: string;
    [3]?: string;
  };
  correct_answer: number;
}

function getType(typeString: string) {
  switch (typeString) {
    case "multiple":
      return QuestionType.MULTIPLE_CHOICE;
    case "boolean":
      return QuestionType.TRUE_OR_FALSE;
    default:
      return QuestionType.UKNOWN;
  }
}

function makeQuestions(results: any): Question[] {
  const questions: Question[] = [];

  for (let r of results) {
    // shuffle the answers by inserting the correct answer into a random index
    const options = r.incorrect_answers;
    const correct_index = Math.floor(Math.random() * options.length);
    options.splice(correct_index, 0, r.correct_answer);

    const q: Question = {
      content: r.question,
      type: getType(r.type),
      difficulty: r.difficulty,
      options: options,
      correct_answer: correct_index,
      category: r.category,
    };
    questions.push(q);
  }

  return questions;
}

function makeQuestionsFromDocs(results: any[]) {
  const questions: Question[] = [];

  for (let r of results) {
    const options = r.options;
    let correct_answer = options.pop();
    const correct_index = Math.floor(Math.random() * options.length);
    options.splice(correct_index, 0, correct_answer);

    questions.push({
      content: r.question,
      type: getType(r.type),
      difficulty: "medium",
      category: r.category,
      options: options,
      correct_answer: correct_index,
    });
  }
  return questions;
}

export class Quiz {
  private state = GameState.STOPPED;
  private readonly client: Client;
  private questions: Question[] = [];
  private static readonly DB_URL = "https://opentdb.com/api.php?amount=10&category=18&difficulty=easy";
  private currentQuestion: Question;
  private channel: Channel;
  private userScores = new Map<User, number>();
  private static pointsPerAnswer = 10;
  private static qDatabase = new DataStore({
    filename: "db/questions.db",
    autoload: true,
  });

  constructor(client: Client) {
    this.client = client;
  }

  public start(channel: Channel): boolean {
    if (this.state != GameState.STOPPED) {
      return false;
    }

    Quiz.qDatabase.find({ category: "cs" }, (err, docs) => {
      if (err) {
        channel.send(
          "An internal error occured while trying to fetch questions."
        );
        return false;
      }

      this.channel = channel;
      this.state = GameState.PLAYING;
      this.questions = makeQuestionsFromDocs(docs);
      this.step();
    });

    return true;
  }

  private makeOptionFields(question: Question) {
    const optFields = [
      {
        name: "A",
        value: question.options[0],
      },
      {
        name: "B",
        value: question.options[1],
      },
    ];

    if (question.options[2]) {
      optFields.push(
        {
          name: "C",
          value: question.options[2],
        },
        {
          name: "D",
          value: question.options[3],
        }
      );
    }

    return optFields;
  }

  private sendQuestion() {
    if (this.questions.length == 0) {
      console.error("all questions used up.");
      return;
    }

    this.currentQuestion = this.questions.pop();

    const embedMessage = Util.makeEmbed({
      title: `Question #${this.questions.length}: `,
      description: this.currentQuestion.content,
      author: config.embedConfig.author,
      fields: this.makeOptionFields(this.currentQuestion),
      color: config.embedColors.success,
    });

    this.channel.send(embedMessage);
    this.state = GameState.AWAITING_ANS;
  }

  private endQuiz() {
    let scores = Array.from(this.userScores).map((e): [string, number] => [
      e[0].username,
      e[1],
    ]);
    scores.sort((a, b) => a[1] - b[1]);

    this.channel.send(`${scores.map(entry => `${entry[0]}: ${entry[1]}`)}`);
    this.stop(this.channel);
    this.state = GameState.STOPPED;
  }

  private step() {
    if (this.questions.length > 0) {
      this.sendQuestion();
    } else {
      this.endQuiz();
    }
  }

  public stop(channel: Channel): boolean {
    if (this.state == GameState.STOPPED) return false;
    this.questions = [];
    this.state = GameState.STOPPED;
    this.channel = null;
    return true;
  }

  public checkAnswer(ans: string, user: User) {
    if (this.state != GameState.AWAITING_ANS) return false;

    const opt = ans.toLowerCase().charCodeAt(0) - 97; // turn it to 'a | 'b' | 'c' | 'd'

    if (this.currentQuestion.correct_answer == opt) {
      this.channel.send(
        `"${this.currentQuestion.options[
          opt
        ]}" was the correct answer! +10 points to ${user.tag}.`
      );

      this.userScores.set(
        user,
        (this.userScores.get(user) || 0) + Quiz.pointsPerAnswer
      );

      this.step();
    }

    return true;
  }
}
