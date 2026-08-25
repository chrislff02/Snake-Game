import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "./App.css";

type Position = {
  x: number;
  y: number;
};

// Ex. 12x12
const BOARD_SIZE = 12;
// Lower # = Faster
const GAME_SPEED = 100;

function createStartingSnake(): Position[] {
  const center = Math.floor(BOARD_SIZE / 2);

  return [
    // Head, body, body
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ];
}

function App() {
  // Space it takes up + when it grows
  const [snake, setSnake] = useState<Position[]>(createStartingSnake());

  // 1st place the apple is
  const [food, setFood] = useState<Position>({
    x: 2,
    y: 2,
  });

  // Always start moving to the right
  const [direction, setDirection] = useState<Position>({
    x: 1,
    y: 0,
  });

  // Current Position
  const directionRef = useRef<Position>({
    x: 1,
    y: 0,
  });

  // One input per movement (no quick left and up etc.)
  const directionChangedRef = useRef(false);

  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const savedHighScore = localStorage.getItem("snakeHighScore");
    return savedHighScore ? Number(savedHighScore) : 0;
  });

  // Makes the apple appear in places where the snake occupies
  function generateFood(currentSnake: Position[]): Position {
    let newFood: Position;

    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE),
      };
    } while (
      currentSnake.some(
        (segment) =>
          segment.x === newFood.x &&
          segment.y === newFood.y
      )
    );

    return newFood;
  }

  // Controls direction of snake's eyes look at
  function getHeadDirectionClass() {
    if (direction.x === 1) {
      return "head-right";
    }

    if (direction.x === -1) {
      return "head-left";
    }

    if (direction.y === -1) {
      return "head-up";
    }

    if (direction.y === 1) {
      return "head-down";
    }

    return "";
  }

  // Turinng isn't locked and game start/restart loop can start
  function startGame() {
    directionChangedRef.current = false;
    setGameStarted(true);
  }

  // Resets everything to the OG state
  function resetGame() {
    const startingSnake = createStartingSnake();

    const startingDirection = {
      x: 1,
      y: 0,
    };

    setSnake(startingSnake);

    setDirection(startingDirection);
    directionRef.current = startingDirection;

    directionChangedRef.current = false;

    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(true);

    setFood(generateFood(startingSnake));
  }

  //How the keyboard is used and what each key does
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isArrowKey =
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight";

      // Don't scroll up/down the webpage
      if (isArrowKey) {
        event.preventDefault();
      }
      
      // Don't move if the game isn't active
      if (!gameStarted || gameOver || gameWon) {
        return;
      }

      // Only allow one turn between each snake movement
      if (directionChangedRef.current) {
        return;
      }

      // Get Current Direction
      const currentDirection = directionRef.current;

      // Direction User can go
      let newDirection: Position | null = null;

      switch (event.key) {
        case "ArrowUp":
          if (currentDirection.y !== 1) {
            newDirection = {
              x: 0,
              y: -1,
            };
          }
          break;

        case "ArrowDown":
          if (currentDirection.y !== -1) {
            newDirection = {
              x: 0,
              y: 1,
            };
          }
          break;

        case "ArrowLeft":
          if (currentDirection.x !== 1) {
            newDirection = {
              x: -1,
              y: 0,
            };
          }
          break;

        case "ArrowRight":
          if (currentDirection.x !== -1) {
            newDirection = {
              x: 1,
              y: 0,
            };
          }
          break;
      }

      if (newDirection) {
        directionRef.current = newDirection;

        setDirection(newDirection);

        // Lock x > 1 direction changes until the snake moves
        directionChangedRef.current = true;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Doesn't create multiple keyboard listeners
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, gameOver, gameWon]);

  // Recreate this effect if any of these values change
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) {
      return;
    }

    // Games speed
    const gameLoop = setInterval(() => {
      const head = snake[0];

      //Where it's going next
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      const hitWall =
        newHead.x < 0 ||
        newHead.x >= BOARD_SIZE ||
        newHead.y < 0 ||
        newHead.y >= BOARD_SIZE;

      const hitSelf = snake.some(
        (segment) =>
          segment.x === newHead.x &&
          segment.y === newHead.y
      );

      if (hitWall || hitSelf) {
        setGameOver(true);
        return;
      }

      // Grew a new part
      const newSnake = [newHead, ...snake];

      const ateFood =
        newHead.x === food.x &&
        newHead.y === food.y;

      if (ateFood) {
        const newScore = score + 1;

        setScore(newScore);

        if (newScore > highScore) {
          setHighScore(newScore);

          localStorage.setItem(
            "snakeHighScore",
            newScore.toString()
          );
        }
        
        // Won game
        if (newSnake.length === BOARD_SIZE * BOARD_SIZE) {
          setSnake(newSnake);

          setGameWon(true);
          setGameStarted(false);

          directionChangedRef.current = false;

          return;
        }

      // No food, no more extended snake
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);

      // Another direction change is now allowed
      directionChangedRef.current = false;
    }, GAME_SPEED);

    return () => {
      clearInterval(gameLoop);
    };
  }, [
    snake,
    direction,
    food,
    score,
    highScore,
    gameStarted,
    gameOver,
    gameWon,
  ]);

  // visual part (JSX)
  return (
    <div className="game-page">
      <div className="game-container">

        <div className="score-bar">
          <div className="score">
            <span className="apple-icon">🍎</span>
            <span>{score}</span>
          </div>

          <div className="high-score">
            <span>🏆</span>
            <span>{highScore}</span>
          </div>
        </div>

        <div className="board-area">

          <div className="board-wrapper">
            <div
              className="board"
              style={{ "--board-size": BOARD_SIZE } as CSSProperties}
            >
              {Array.from({
                length: BOARD_SIZE * BOARD_SIZE,
              }).map((_, index) => {
                // Convert index into x/y coordinates
                const x = index % BOARD_SIZE;
                const y = Math.floor(index / BOARD_SIZE);

                // For Checkerboard
                const isDarkSquare =
                  (x + y) % 2 === 0;

                const isSnake = snake.some(
                  (segment) =>
                    segment.x === x &&
                    segment.y === y
                );

                const isSnakeHead =
                  snake[0].x === x &&
                  snake[0].y === y;

                const isFood =
                  food.x === x &&
                  food.y === y;

                // If the square becomes the apple or the snake square
                return (
                  <div
                    key={index}
                    className={`cell
                      ${
                        isDarkSquare
                          ? "dark-cell"
                          : "light-cell"
                      }
                      ${isSnake ? "snake" : ""}
                      ${
                        isSnakeHead
                          ? `snake-head ${getHeadDirectionClass()}`
                          : ""
                      }
                      ${isFood ? "food" : ""}
                    `}
                  />
                );
              })}
            </div>
          </div>

          {!gameStarted && !gameOver && !gameWon && (
            <div className="game-over-overlay">
              <div className="game-over-box">
                <h2>Snake Game</h2>

                <p className="start-message">
                  Press the button to start.
                </p>

                <button onClick={startGame}>
                  Start Game
                </button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="game-over-overlay">
              <div className="game-over-box">
                <h2>Game Over</h2>

                <div className="game-over-scores">
                  <div className="final-score">
                    <span className="final-score-apple">
                      🍎
                    </span>

                    <span>{score}</span>
                  </div>

                  <div className="final-high-score">
                    <span>🏆</span>
                    <span>{highScore}</span>
                  </div>
                </div>

                <button onClick={resetGame}>
                  Play Again
                </button>
              </div>
            </div>
          )}

          {gameWon && (
            <div className="game-over-overlay">
              <div className="game-over-box">
                <h2>You Won!!</h2>

                <div className="game-over-scores">
                  <div className="final-score">
                    <span className="final-score-apple">
                      🍎
                    </span>

                    <span>{score}</span>
                  </div>

                  <div className="final-high-score">
                    <span>🏆</span>
                    <span>{highScore}</span>
                  </div>
                </div>

                <button onClick={resetGame}>
                  Play Again
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="instructions">
          Use the arrow keys to move.
        </p>

      </div>
    </div>
  );
}

export default App;