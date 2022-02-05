// Retrieve references to html elements
const grid = document.querySelector(".grid");
const scoreDisplay = document.querySelector("#score-display");
const scoreDisplayModal = document.querySelector("#score-display-modal");
const gameoverMessageModal = document.getElementById("gameover-message-modal");
const highScoreDisplay = document.getElementById("high-score-display");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const instructionsButton = document.getElementById("instructions-button");
const goBackToGame = document.getElementById("go-back-to-game");
const goToGame = document.getElementById("go-to-game");
const gameOver = document.getElementById("game-over");
const gameInstructions = document.getElementById("game-instructions");
const soundIcon = document.getElementsByClassName("sound-icon").item(0);

// Constant values
const width = grid.clientWidth / 20;
const totalSquares = width * width;
const speedScalingFactor = 0.9;
const initialUpdatePeriod = 1000; // Inter-update period in ms
const snakeBodyBlocks = [
  "snake-body-horizontal",
  "snake-body-vertical",
  "snake-head-down",
  "snake-head-left",
  "snake-head-right",
  "snake-head-up",
  "snake-tail-down",
  "snake-tail-left",
  "snake-tail-right",
  "snake-tail-up",
  "snake-body-bl",
  "snake-body-br",
  "snake-body-tl",
  "snake-body-tr",
];
const crashSound = new Audio("sounds/crash.mp3");
const munchingSound = new Audio("sounds/munch.wav");
const winSound = new Audio("sounds/win.mp3");

// State variables
let highScore;
let timerId;
let squares = [];
let events = [];
let currentSnake = [2, 1, 0];
let intervalTime = initialUpdatePeriod;
let gamePaused = true;
let totalScore = 0;
let direction = 1;
let appleIdx = -1;
let soundOff = false;

// Initialize the game
initializeGame();

// Supporting utility functions
function initializeGame() {
  createGrid();

  // Draw snake
  drawCurrentSnake();

  // Register event handlers
  registerEventHandlers();

  // Load cached high score
  loadHighScore();

  // Hide pause button
  hidePauseButton();

  // Show game instructions
  toggleDisplay(gameInstructions);
}

function createGrid() {
  // Create a grid that consists of 15 by 15 squares
  let lightSquare = false;
  let count = 0;

  for (let idx = 0; idx < totalSquares; idx++) {
    const square = document.createElement("div");

    if (count % width === 0) {
      lightSquare = !lightSquare;
      count = 0;
    }

    // Alternate between light and dark squares
    if (count % 2 === 0) {
      square.classList.add(lightSquare ? "square-light" : "square-dark");
    } else {
      square.classList.add(lightSquare ? "square-dark" : "square-light");
    }

    count++;

    grid.appendChild(square);
    squares.push(square);
  }
}

function removeSnakeBlocks(targetSquare) {
  targetSquare.classList.remove(...snakeBodyBlocks);
}

function drawCurrentSnake() {
  currentSnake.forEach((currentSquareIdx, currentSnakeIdx) => {
    const currentSquare = squares[currentSquareIdx];
    removeSnakeBlocks(currentSquare);
    const currentSquareClassList = currentSquare.classList;
    if (currentSnakeIdx === 0) {
      updateHeadImage(currentSquareClassList);
    } else if (currentSnakeIdx === currentSnake.length - 1) {
      updateTailImage(currentSquareClassList);
    } else {
      const nextSquareIdx = currentSnake[currentSnakeIdx + 1];
      const previousSquareIdx = currentSnake[currentSnakeIdx - 1];
      const distToNextSquare = nextSquareIdx - currentSquareIdx;
      const distToPreviousSquare = currentSquareIdx - previousSquareIdx;

      updateBodyImage(
        currentSquareClassList,
        distToNextSquare,
        distToPreviousSquare
      );
    }
  });
}

function updateHeadImage(headClassList) {
  const headDirection = currentSnake[1] - currentSnake[0];
  switch (headDirection) {
    case 1:
      headClassList.add("snake-head-left");
      break;
    case -1:
      headClassList.add("snake-head-right");
      break;
    case -width:
      headClassList.add("snake-head-down");
      break;
    case width:
      headClassList.add("snake-head-up");
  }
}

function updateTailImage(tailClassList) {
  const snakeLength = currentSnake.length;
  const tailDirection =
    currentSnake[snakeLength - 2] - currentSnake[snakeLength - 1];
  switch (tailDirection) {
    case 1:
      tailClassList.add("snake-tail-left");
      break;
    case -1:
      tailClassList.add("snake-tail-right");
      break;
    case -width:
      tailClassList.add("snake-tail-down");
      break;
    case width:
      tailClassList.add("snake-tail-up");
  }
}

function updateBodyImage(
  bodyClassList,
  distToNextSquare,
  distToPreviousSquare
) {
  if (
    (distToNextSquare === 1 && distToPreviousSquare === 1) ||
    (distToNextSquare === -1 && distToPreviousSquare === -1)
  ) {
    bodyClassList.add("snake-body-horizontal");
  } else if (
    (distToNextSquare === width && distToPreviousSquare === width) ||
    (distToNextSquare === -width && distToPreviousSquare === -width)
  ) {
    bodyClassList.add("snake-body-vertical");
  } else {
    if (
      (distToNextSquare === -width && distToPreviousSquare === 1) ||
      (distToNextSquare === -1 && distToPreviousSquare === width)
    ) {
      bodyClassList.add("snake-body-tl");
    } else if (
      (distToNextSquare === -1 && distToPreviousSquare === -width) ||
      (distToNextSquare === width && distToPreviousSquare === 1)
    ) {
      bodyClassList.add("snake-body-bl");
    } else if (
      (distToNextSquare === 1 && distToPreviousSquare === width) ||
      (distToNextSquare === -width && distToPreviousSquare === -1)
    ) {
      bodyClassList.add("snake-body-tr");
    } else {
      bodyClassList.add("snake-body-br");
    }
  }
}

function registerEventHandlers() {
  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", pauseGame);
  soundIcon.addEventListener("click", toggleSound);
  document.addEventListener("keydown", control);
  instructionsButton.addEventListener("click", () => {
    toggleDisplay(gameInstructions);
    if (pauseButton.style.display === "inline-block" && !gamePaused) {
      pauseGame();
    }
  });
  goToGame.addEventListener("click", () => toggleDisplay(gameInstructions));
  goBackToGame.addEventListener("click", () => toggleDisplay(gameOver));
}

function loadHighScore() {
  highScore = localStorage.getItem("highScore");
  if (highScore !== undefined) {
    highScoreDisplay.textContent = highScore === null ? 0 : highScore;
  }
}

// Show/hide element
function toggleDisplay(element) {
  let noDisplayValue = element.style.display === "";

  if (noDisplayValue || element.style.display === "none") {
    element.style.display = "block";
  } else {
    element.style.display = "none";
  }
}

function hidePauseButton() {
  pauseButton.style.display = "none";
}

function showPauseButton() {
  pauseButton.textContent = "Pause Game";
  pauseButton.style.display = "inline-block";
}

function pauseGame() {
  if (gamePaused) {
    gamePaused = false;
    pauseButton.textContent = "Pause Game";
    timerId = setInterval(move, intervalTime);
  } else {
    gamePaused = true;
    pauseButton.textContent = "Resume Game";
    if (timerId !== undefined) {
      clearInterval(timerId);
    }
  }
}

function toggleSound() {
  soundIcon.classList.toggle("fa-volume-mute");
  soundIcon.classList.toggle("fa-volume-up");
  soundOff = !soundOff;
  crashSound.muted = soundOff;
  munchingSound.muted = soundOff;
  winSound.muted = soundOff;
}

function startGame() {
  stopTimer();
  // Remove the snake
  removeCurrentSnake();
  // Remove the apple
  removeApple(squares[appleIdx]);

  // Reset state variables
  resetStateVariables();

  // Add cached high score to browser
  loadHighScore();
  // Add initial score to browser
  setScore(scoreDisplay, totalScore);

  // Draw current snake and add an apple
  drawCurrentSnake();
  generateApple();

  // Show pause button
  showPauseButton();

  // Start the timer
  startTimer();
}

function removeCurrentSnake() {
  currentSnake.forEach((idx) => removeSnakeBlocks(squares[idx]));
}

function removeApple(targetSquare) {
  if (appleIdx !== -1) {
    targetSquare.classList.remove("apple");
  }
}

function resetStateVariables() {
  gamePaused = false;
  currentSnake = [2, 1, 0];
  events = [];
  direction = 1;
  totalScore = 0;
  intervalTime = initialUpdatePeriod;
}

function setScore(display, score) {
  display.textContent = score;
}

function startTimer() {
  timerId = setInterval(move, intervalTime);
}

function stopTimer() {
  if (timerId !== undefined) {
    clearInterval(timerId);
  }
}

function generateApple() {
  // Function used to randomly place an apple in grid
  const includeTail = true;
  do {
    appleIdx = Math.floor(Math.random() * totalSquares);
  } while (
    squares[appleIdx].classList.contains("apple") ||
    containsSnakeBlock(squares[appleIdx], includeTail)
  );
  squares[appleIdx].classList.add("apple");
}

function getNextEvent() {
  // Get next keyboard event from events array
  let nextEvent = null;
  if (events.length !== 0) {
    nextEvent = events.shift();
  }
  return nextEvent;
}

function setSnakeDirection() {
  let nextEvent = getNextEvent();

  if (nextEvent !== null) {
    // Set direction of snake based on keyboard event
    direction = nextEvent.direction;
  }
}

function move() {
  setSnakeDirection();

  if (isGameOver()) {
    playCrashSound();
    takeGameOverActions();
    return;
  }
  // Remove tail of snake
  const tailSquareIdx = removeSnakeTail();

  // Add a new head to snake
  const newHeadSquare = addSnakeHead();

  // Eat apple if new square has one
  if (checkCollisionWithApple(newHeadSquare)) {
    // Remove the apple
    removeApple(newHeadSquare);

    playAppleMunchingSound();

    // Make the snake grow after eating apple
    growSnake(tailSquareIdx);

    // Generate a new apple
    generateApple();

    // Update total score
    totalScore++;
    setScore(scoreDisplay, totalScore);

    // Speed up the snake
    increaseSnakeSpeed();
  }

  // Redraw the snake
  drawCurrentSnake();
}

function isGameOver() {
  // Game is over if one of following conditions is satified:
  // Snake hits bottom of grid or
  // It hits right wall or
  // It hits left wall or
  // It hits top wall or
  // It hits itself

  const hitBottom =
    currentSnake[0] + width >= totalSquares && direction === width;
  const hitRight = currentSnake[0] % width === width - 1 && direction === 1;
  const hitLeft = currentSnake[0] % width === 0 && direction === -1;
  const hitTop = currentSnake[0] - width < 0 && direction === -width;

  if (hitBottom || hitRight || hitLeft || hitTop) {
    return true;
  }

  const nextSquare = squares[currentSnake[0] + direction];
  const includeTail = false;
  const hitItself = containsSnakeBlock(nextSquare, includeTail);
  return hitItself;
}

function playCrashSound() {
  crashSound.play();
}

function containsSnakeBlock(targetSquare, includeTail) {
  for (let idx = 0; idx < snakeBodyBlocks.length; idx++) {
    const block = snakeBodyBlocks[idx];
    if (block.startsWith("snake-tail") && !includeTail) {
      continue;
    }
    if (targetSquare.classList.contains(block)) {
      return true;
    }
  }
}

function takeGameOverActions() {
  const message = gameWon() ? "You won 🎉🎉!!" : "Game over!";
  updateHighScore();
  clearInterval(timerId);
  hidePauseButton();
  setScore(scoreDisplayModal, totalScore);
  setModalMessage(gameoverMessageModal, message);
  toggleDisplay(gameOver);
}

function gameWon() {
  if (currentSnake.length === totalSquares) {
    winSound.play();
    return true;
  } else {
    return false;
  }
}

function setModalMessage(modal, message) {
  modal.textContent = message;
}

function updateHighScore() {
  if (highScore) {
    highScore = Math.max(highScore, totalScore);
  } else {
    highScore = totalScore;
  }
  localStorage.setItem("highScore", highScore);
}

function removeSnakeTail() {
  const tailSquareIdx = currentSnake.pop();
  removeSnakeBlocks(squares[tailSquareIdx]);
  return tailSquareIdx;
}

function addSnakeHead() {
  currentSnake.unshift(currentSnake[0] + direction);
  const newHeadSquare = squares[currentSnake[0]];
  return newHeadSquare;
}

function checkCollisionWithApple(targetSquare) {
  return targetSquare.classList.contains("apple");
}

function playAppleMunchingSound() {
  munchingSound.play();
}

function growSnake(targetSquareIdx) {
  currentSnake.push(targetSquareIdx);
}

function increaseSnakeSpeed() {
  clearInterval(timerId);
  intervalTime *= speedScalingFactor;
  timerId = setInterval(move, intervalTime);
}

function control(e) {
  // Function used to control the movement of snake
  if (e.key !== undefined && !gamePaused) {
    const pressedKey = e.key;
    // Get previous keyboard event
    let prevEvent = getPreviousEvent();
    // Current keyboard event is dependent on previous event only
    const currentEvent = {};
    const prevDirectionValue =
      prevEvent === null ? direction : prevEvent.direction;
    currentEvent.direction = updateSnakeDirection(
      pressedKey,
      prevDirectionValue
    );

    if (currentEvent.direction !== null) {
      events.push(currentEvent);
    }
  }

  function getPreviousEvent() {
    let prevEvent = null;
    if (events.length !== 0) {
      prevEvent = events[events.length - 1];
    }
    return prevEvent;
  }

  function updateSnakeDirection(pressedKey, prevDirectionValue) {
    let output = null;
    switch (pressedKey) {
      case "ArrowLeft":
        if (prevDirectionValue !== 1) output = -1;
        break;
      case "ArrowUp":
        if (prevDirectionValue !== width) output = -width;
        break;
      case "ArrowRight":
        if (prevDirectionValue !== -1) output = 1;
        break;
      case "ArrowDown":
        if (prevDirectionValue !== -width) output = width;
    }
    return output;
  }
}
