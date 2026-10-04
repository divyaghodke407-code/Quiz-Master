
const API_URL = "http://localhost:5000";

let questions = [];
let currentQuestion = 0;
let score = 0;
let timeLeft = 30;
let timer;
let selected = false;
let studentName = "";

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("nextBtn");

const setup = document.getElementById("setup");
const quiz = document.getElementById("quiz");
const result = document.getElementById("result");

const timeEl = document.getElementById("time");
const feedbackEl = document.getElementById("feedback");

// Generate AI Quiz

async function generateQuiz() {

    studentName = document.getElementById("studentName").value.trim();

    const topic = document.getElementById("topic").value;
    const difficulty = document.getElementById("difficulty").value;

    if (!studentName) {
        alert("Please enter your name!");
        return;
    }

    const startBtn = document.getElementById("startBtn");
    const loadingText = document.getElementById("loadingText");

    startBtn.disabled = true;
    loadingText.textContent = "🤖 AI is generating new questions...";

    try {

        const response = await fetch(`${API_URL}/api/generate-quiz`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                topic,
                difficulty
            })
        });

        const data = await response.json();
console.log("AI API Response:", data);
console.log("Questions Received:", data.questions);
       
if (!response.ok) {
            throw new Error(data.message || "AI Quiz generation failed");
        }

if (!Array.isArray(data.questions) || data.questions.length < 1) {
    throw new Error("No valid questions received from AI");
}

        questions = data.questions;
        
console.log("Quiz Started Successfully!");
console.log("First Question:", questions[0]);
        currentQuestion = 0;
        score = 0;

        setup.classList.add("hidden");
        result.classList.add("hidden");
        quiz.classList.remove("hidden");

        showQuestion();

    } catch (error) {

        console.error(error);

        loadingText.textContent = error.message;

    } finally {

        startBtn.disabled = false;

    }
}

// Timer

function startTimer() {

    clearInterval(timer);

    timeLeft = 30;
    timeEl.textContent = timeLeft;

    timer = setInterval(() => {

        timeLeft--;

        timeEl.textContent = timeLeft;

        if (timeLeft <= 0) {

            clearInterval(timer);

            revealAnswer();

        }

    }, 1000);
}

// Load Question

function showQuestion() {

    clearInterval(timer);

    selected = false;
    nextBtn.disabled = true;

    const q = questions[currentQuestion];

    questionEl.textContent = q.question;

    optionsEl.innerHTML = "";

    document.getElementById("questionCount").textContent =
        `Question ${currentQuestion + 1} of ${questions.length}`;

    document.getElementById("scoreText").textContent =
        `Score: ${score}`;

    document.getElementById("progress").style.width =
        `${((currentQuestion + 1) / questions.length) * 100}%`;

    feedbackEl.textContent = "";

    q.options.forEach((option, index) => {

        const button = document.createElement("button");

        button.className = "option";
        button.textContent = option;

        button.addEventListener("click", () => {
            selectAnswer(index);
        });

        optionsEl.appendChild(button);

    });

    nextBtn.textContent =
        currentQuestion === questions.length - 1
        ? "View Result →"
        : "Next Question →";

    startTimer();
}

// Select Answer

function selectAnswer(index) {

    if (selected) return;

    selected = true;

    clearInterval(timer);

    const correctAnswer = questions[currentQuestion].answer;

    const buttons = document.querySelectorAll(".option");

    buttons.forEach((button, i) => {

        button.disabled = true;

        if (i === correctAnswer) {
            button.classList.add("correct");
        }

        if (i === index && index !== correctAnswer) {
            button.classList.add("wrong");
        }

    });

    if (index === correctAnswer) {

        score++;

        feedbackEl.textContent = "Correct Answer! 🎉";

    } else {

        feedbackEl.textContent =
            "Incorrect! Correct answer is highlighted.";

    }

    document.getElementById("scoreText").textContent =
        `Score: ${score}`;

    nextBtn.disabled = false;
}

// Time Up

function revealAnswer() {

    if (selected) return;

    selected = true;

    const correctAnswer = questions[currentQuestion].answer;

    const buttons = document.querySelectorAll(".option");

    buttons.forEach((button, i) => {

        button.disabled = true;

        if (i === correctAnswer) {
            button.classList.add("correct");
        }

    });

    feedbackEl.textContent =
        "Time's up! Correct answer is highlighted.";

    nextBtn.disabled = false;
}

// Next Question

nextBtn.addEventListener("click", () => {

    if (!selected) return;

    clearInterval(timer);

    if (currentQuestion < questions.length - 1) {

        currentQuestion++;

        showQuestion();

    } else {

        showResult();

    }

});

// Final Result

async function showResult() {

    clearInterval(timer);

    quiz.classList.add("hidden");
    result.classList.remove("hidden");

    const totalQuestions = questions.length;

    const percentage = Math.round(
        (score / totalQuestions) * 100
    );

    document.getElementById("finalScore").textContent =
        `${score}/${totalQuestions}`;

    document.getElementById("message").textContent =
        score === totalQuestions
        ? "Excellent! Perfect Score 🏆"
        : score >= 3
        ? "Good Job! Keep Practicing 👏"
        : "Keep Learning. You Can Do Better! 💪";

    const aiFeedback = document.getElementById("aiFeedback");

    aiFeedback.textContent =
        "🤖 Generating AI feedback...";

    try {

        const response = await fetch(`${API_URL}/api/results`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                studentName,
                score,
                totalQuestions
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Result saving failed");
        }

        aiFeedback.textContent =
            data.result.feedback || "Keep practicing!";

        document.getElementById("message").textContent +=
            " | Result Saved Successfully!";

    } catch (error) {

        console.error(error);

        aiFeedback.textContent =
            "AI feedback unavailable. Please check backend connection.";

    }
}

// Restart Quiz

function restartQuiz() {

    clearInterval(timer);

    currentQuestion = 0;
    score = 0;
    questions = [];

    result.classList.add("hidden");
    quiz.classList.add("hidden");
    setup.classList.remove("hidden");

    document.getElementById("loadingText").textContent = "";

    timeEl.textContent = "30";

}

// Start Button

document.getElementById("startBtn").addEventListener(
    "click",
    generateQuiz
);