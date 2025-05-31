const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
const rows = canvas.height / box;
const cols = canvas.width / box;

let snake = [{ x: 9 * box, y: 10 * box }];
let direction = "RIGHT";
let score = 0;
let gameInterval;
let isAIMode = false;

let obstacles = [];
let food = null;

function generateObstacles(count) {
  const obs = [];
  while (obs.length < count) {
    const o = {
      x: Math.floor(Math.random() * cols) * box,
      y: Math.floor(Math.random() * rows) * box,
    };
    if (
      !snake.some((s) => s.x === o.x && s.y === o.y) &&
      !obs.some((existing) => existing.x === o.x && existing.y === o.y)
    ) {
      obs.push(o);
    }
  }
  return obs;
}

function generateFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * cols) * box,
      y: Math.floor(Math.random() * rows) * box,
    };
  } while (
    snake.some((s) => s.x === pos.x && s.y === pos.y) ||
    obstacles.some((o) => o.x === pos.x && o.y === pos.y)
  );
  return pos;
}

function drawBox(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, box, box);
}

function drawEyes(x, y, dir) {
  ctx.fillStyle = "white";
  let eye1X, eye1Y, eye2X, eye2Y;

  if (dir === "RIGHT") {
    eye1X = x + box * 0.65;
    eye1Y = y + box * 0.25;
    eye2X = x + box * 0.65;
    eye2Y = y + box * 0.65;
  } else if (dir === "LEFT") {
    eye1X = x + box * 0.2;
    eye1Y = y + box * 0.25;
    eye2X = x + box * 0.2;
    eye2Y = y + box * 0.65;
  } else if (dir === "UP") {
    eye1X = x + box * 0.25;
    eye1Y = y + box * 0.2;
    eye2X = x + box * 0.65;
    eye2Y = y + box * 0.2;
  } else if (dir === "DOWN") {
    eye1X = x + box * 0.25;
    eye1Y = y + box * 0.65;
    eye2X = x + box * 0.65;
    eye2Y = y + box * 0.65;
  }

  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, box * 0.1, 0, 2 * Math.PI);
  ctx.arc(eye2X, eye2Y, box * 0.1, 0, 2 * Math.PI);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  obstacles.forEach((o) => drawBox(o.x, o.y, "brown"));
  drawBox(food.x, food.y, "blue");

  snake.forEach((segment, index) => {
    drawBox(segment.x, segment.y, "green");
    if (index === 0) drawEyes(segment.x, segment.y, direction);
  });

  document.getElementById("score").textContent = "Score: " + score;
}

function moveSnake() {
  const head = { ...snake[0] };

  if (isAIMode) {
    const nextMove = findNextMove();
    if (nextMove) direction = nextMove;
  }

  if (direction === "RIGHT") head.x += box;
  else if (direction === "LEFT") head.x -= box;
  else if (direction === "UP") head.y -= box;
  else if (direction === "DOWN") head.y += box;

  if (
    head.x < 0 ||
    head.x >= canvas.width ||
    head.y < 0 ||
    head.y >= canvas.height ||
    snake.some((s) => s.x === head.x && s.y === head.y) ||
    obstacles.some((o) => o.x === head.x && o.y === head.y)
  ) {
    clearInterval(gameInterval);
    alert("Game Over! Your score: " + score);
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    food = generateFood();
  } else {
    snake.pop();
  }

  draw();
}

function toggleMode() {
  isAIMode = !isAIMode;
  document.getElementById("modeToggle").textContent = isAIMode
    ? "Switch to Human Mode"
    : "Switch to AI Mode";
}

function restartGame() {
  snake = [{ x: 9 * box, y: 10 * box }];
  direction = "RIGHT";
  score = 0;
  obstacles = generateObstacles(10);
  food = generateFood();
  draw();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(moveSnake, 150);
}

document.getElementById("modeToggle").addEventListener("click", toggleMode);
document.getElementById("restartBtn").addEventListener("click", restartGame);

document.addEventListener("keydown", (e) => {
  if (isAIMode) return;
  if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  else if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
});

function neighbors(pos) {
  return [
    { x: pos.x + box, y: pos.y },
    { x: pos.x - box, y: pos.y },
    { x: pos.x, y: pos.y + box },
    { x: pos.x, y: pos.y - box },
  ].filter(
    (p) =>
      p.x >= 0 &&
      p.x < canvas.width &&
      p.y >= 0 &&
      p.y < canvas.height &&
      !snake.some((s) => s.x === p.x && s.y === p.y) &&
      !obstacles.some((o) => o.x === p.x && o.y === p.y)
  );
}

function findNextMove() {
  const start = snake[0];
  const queue = [{ pos: start, path: [] }];
  const visited = new Set();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, path } = queue.shift();

    if (pos.x === food.x && pos.y === food.y) {
      if (path.length === 0) return direction;
      const nextStep = path[0];
      if (nextStep.x > start.x) return "RIGHT";
      if (nextStep.x < start.x) return "LEFT";
      if (nextStep.y > start.y) return "DOWN";
      if (nextStep.y < start.y) return "UP";
    }

    for (const next of neighbors(pos)) {
      const key = `${next.x},${next.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ pos: next, path: [...path, next] });
      }
    }
  }
  return direction;
}

restartGame();
