import {
  Client,
  Message,
  TextChannel,
  DMChannel,
  NewsChannel,
} from "discord.js";

import fetch = require("node-fetch");

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
    [1]: string;
    [2]: string;
    [3]?: string;
    [4]?: string;
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

export class Quiz {
  private state = GameState.STOPPED;
  private readonly client: Client;
  private questions: Question[] = [];
  private static readonly DB_URL = "https://opentdb.com/api.php?amount=10&category=18&difficulty=easy";
  private currentQuestion: Question;

  constructor(client: Client) {
    this.client = client;
  }

  public start(channel: Channel): boolean {
    if (this.state != GameState.STOPPED) {
      return false;
    }

    fetch(Quiz.DB_URL) // get the data
      .then(res => res.json()) // parse JSON
      .then(json => {
        if (json.response_code != 0) {
          channel.send(
            "An error occured while trying to fetch questions. please try again later. Erro code was: ",
            json.response_code
          );
          return false;
        }

        this.state = GameState.PLAYING;
        this.questions = makeQuestions(json.results);
        this.sendQuestion(channel);
      });

    return true;
  }

  private sendQuestion(channel: Channel) {
    if (this.questions.length == 0) {
      console.error('all questions used up.');
    }

    channel.send(this.questions.pop());
    channel.send(
      `
      0: ${this.questions[0].options[0]}
      1: ${this.questions[0].options[1]}
      2: ${this.questions[0].options[2]}
      3: ${this.questions[0].options[3]}
    `
    );
  }

  public stop(channel: Channel): boolean {
    if (this.state == GameState.STOPPED) return false;
    this.questions = [];
    this.state = GameState.STOPPED;
    return true;
  }

  public checkAnswer(ans: number) {
    
  }
}
