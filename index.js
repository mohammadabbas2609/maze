const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = window.innerWidth;
const height = window.innerHeight;

const cellsHorizontal = 10;
const cellsVertical = 15;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
// Disabling gravity
engine.world.gravity.y = 0;

const { world } = engine;
const render = Render.create({
  element: document.body,
  engine,
  options: {
    width,
    height,
    wireframes: false, //if true shapes will be skeleton otherwise colorfull.
    sleeping: true,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
// Generic code for generating walls according to width and height
const walls = [
  Bodies.rectangle(width / 2, 0, width, 4, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 4, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 4, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 4, height, { isStatic: true }),
];

World.add(world, walls);

// Maze Generation

// Solution  for generating grid
const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const shuffle = arr => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const stepsInCell = (row, col) => {
  // If Visited cell at [row,col] return
  if (grid[row][col]) return;
  // Mark this cell as visited
  grid[row][col] = true;
  // Assemble randomly-ordered list of neighbours
  const neighbours = shuffle([
    [row - 1, col, "up"],
    [row, col + 1, "right"],
    [row + 1, col, "down"],
    [row, col - 1, "left"],
  ]);
  // For each neighbour...
  for (let neighbour of neighbours) {
    // Checking if neighbour is out of bounds
    const [nextRow, nextColumn, direction] = neighbour;
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue;
    }
    // Visited that neighbour continue to next neighbour
    if (grid[nextRow][nextColumn]) {
      continue;
    }
    // Remove wall from either horizontals or verticals i.e change value to falsy value to true
    if (direction === "left") {
      verticals[row][col - 1] = true;
    } else if (direction === "right") {
      verticals[row][col] = true;
    } else if (direction === "up") {
      horizontals[row - 1][col] = true;
    } else if (direction === "down") {
      horizontals[row][col] = true;
    }

    stepsInCell(nextRow, nextColumn);
  }
  // Visit next cell
};

stepsInCell(startRow, startColumn);

// document.querySelector("button").addEventListener("click", () => {
//   console.log("clikced");
//   stepsInCell(startRow, startColumn);
// });

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (!open) {
      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX / 2,
        rowIndex * unitLengthY + unitLengthY,
        unitLengthX,
        1,
        {
          label: "wall",
          isStatic: true,
          render: {
            fillStyle: "red",
          },
        }
      );

      World.add(world, wall);
    }
  });
});

verticals.forEach(function (row, rowIndex) {
  row.forEach(function (open, columnIndex) {
    if (!open) {
      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        1,
        unitLengthY,
        {
          label: "wall",
          isStatic: true,
          render: {
            fillStyle: "red",
          },
        }
      );

      World.add(world, wall);
    }
  });
});

const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    label: "goal",
    isStatic: true,
    render: {
      fillStyle: "green",
    },
  }
);

World.add(world, goal);

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
  render: {
    fillStyle: "coral",
  },
});

World.add(world, ball);

document.addEventListener("keydown", event => {
  let velocitySpeed = 0.7;
  const { x, y } = ball.velocity;

  if (event.code === "ArrowUp" || event.code === "KeyW") {
    Body.setVelocity(ball, { x, y: y - velocitySpeed });
  } else if (event.code === "ArrowDown" || event.code === "KeyS") {
    Body.setVelocity(ball, { x, y: y + velocitySpeed });
  } else if (event.code === "ArrowRight" || event.code === "KeyD") {
    Body.setVelocity(ball, { x: x + velocitySpeed, y });
  } else if (event.code === "ArrowLeft" || event.code === "KeyA") {
    Body.setVelocity(ball, { x: x - velocitySpeed, y });
  }
});

Events.on(engine, "collisionStart", event => {
  event.pairs.forEach(collision => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector(".reset").classList.add("show");
      world.gravity.y = 1;
      world.bodies.forEach(body => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
