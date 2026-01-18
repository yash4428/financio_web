const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function evaluateAnswer(userText, step) {
  const text = normalize(userText);

  console.log("Normalized text:", text);
  console.log("Checking keywords:", step.correctKeywords);

  const correct = step.correctKeywords.some(keyword =>
    text.includes(keyword)
  );

  return {
    isCorrect: correct,
    explanation: step.explanation,
    nextStepId: correct
      ? step.nextStepCorrect
      : step.nextStepWrong
  };
}

module.exports = evaluateAnswer;