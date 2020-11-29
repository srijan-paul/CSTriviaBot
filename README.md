# CSTriviaBot - Sharpy

![screenshot](https://i.imgur.com/GcYvXyB.gif)

A general purpose discord bot. It can conduct quizzes, maintain user reputation, show cat and dog pics
and a lot more fun stuff.

# Add Sharpy

To add sharpy to your discord server, click [here](www.discord.com), and select
the server you want to add it to, then click authenticate.

# Features

Sharpy is a multi purpose bot! It has many fun features you can use.
Use the magic 8ball to get the answers to the most important questions in your life,
spend time spamming cute dog and cat images or conduct quizzes to entertain yourself
and the members of your server!

Sharpy also comes with a reputation system that helps keep track of how good or bad
your members have been ;)

# Usage

The prefix for this bot is `?`, but can be changed on demand using `?prefix <new prefix>`
since Sharpy's prefixes are scoped to each server.

As of now, the following commands are available:

- `?startquiz` - start a quiz session.
- `?a <option>` - answer the last question, option is one of `A` , `B`, `C` or `D`.
- `?stopquiz` - stop an ongoing quiz
- `?rep` - give +1 reputation to someone, as a token of thanks.
- `?negrep` - give -1 reputation to someone. (by default, only server moderators can do this).
- `?dogpic` - post a random image or gif of a cute dog 🐶.
- `?catpic` - post a random iamge or gif of a cute cat 🐱.
- `?hero <name>` - post the stats, info and image of a superhero from comic books or movies! (eg - `?hero Spider-Man`).
- `?8ball <question>` - Use the magic 8 ball to answer a question! (eg - `?8ball will I find happiness in life?` ).

# Credits

I've used a couple of generous 3rd party APIs to make this bot. The database is hosted on google firebase, and the following
APIs have been used:

- [superhero-api](https://akabab.github.io/superhero-api/) I used a modified version of this API to fetch the image and stats of superheroes.
- [random-dog](https://random.dog/) Used for the `?dogpics` command.
- [theCatApi](https://thecatapi.com/) Used for the `?catpics` command
