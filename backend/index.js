const express = require("express");
const cors = require("cors");
const farmerScenario = require("./scenario/farmerLoan.json");
const evaluateAnswer = require("./evaluateAnswer");

const app = express();
app.use(cors());
app.use(express.json());


app.get("/scenario/:stepId", (req, res) => {
  const stepId = parseInt(req.params.stepId);
  const step = farmerScenario.steps.find(s => s.stepId === stepId);
  res.json(step);
});

app.post("/answer", (req, res) => {
  const { userText, stepId } = req.body;
  const step = farmerScenario.steps.find(s => s.stepId === stepId);

  const result = evaluateAnswer(userText, step);
   console.log("ANSWER RESULT:", result); // 🔥 ADD THIS
  res.json(result);
});

app.listen(5001, () => {
  console.log("Server running on port 5001");
});