import DataStore = require("nedb");
import express = require("express");
import path = require("path");

const app = express();
app.use(express.json());

const PORT = 8080;

const qdb = new DataStore({
  filename: "../../../db/questions.db",
  autoload: true,
});

app.get("/", (req, res) => {
  res.sendFile(path.resolve("../../../public/index.html"));
});

app.post("/", (req, res) => {
  const data = req.body;
  qdb.insert(data);
  res.send({
    status: "question added successfully",
  });
});

app.listen(PORT, () => console.log(`server started on port ${PORT}`));
