const express = require("express");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express());

let db = null;

const initializeDbServerToRespondServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("server running at https://localhos:3000/")
    );
  } catch (e) {
    console.log(`DB ERROR : ${e.message}`);
    process.exit(1);
  }
};

initializeDbServerToRespondServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API-1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE
            todo LIKE '%${search_q}' AND status = '${status}'
            AND priority = '${priority}';`;

      break;
    case hasPriorityProperties(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE
            todo LIKE '%${search_q}' AND priority = '${priority}';`;
      break;
    case hasStatusProperties(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE
            todo LIKE '%${search_q}' AND status = '${status}';`;

    default:
      getTodoQuery = `SELECT * FROM todo WHERE
            todo LIKE '%${search_q}';`;
  }
  data = await db.all(getTodoQuery);

  response.send(data);
});

//API-2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `SELECT * FROM todo WHERE id = ${todoId};`;

  const data = await db.get(getTodoIdQuery);

  response.send(data);
});

//API-3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const postTodosQuery = `INSERT INTO todo(id,todo,priority,status) VALUES(${id},${todo},${priority},${status});`;

  await db.run(postTodosQuery);
  response.send("Todo Successfully Added");
});

//API-4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";

    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodQuery = `UPDATE todo 
  SET 
  todo = ${todo}
  priority = ${priority},
  status = ${status}
  WHERE id = ${todoId};`;

  await db.run(updateTodQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteQuery = `SELECT * FROM todo WHERE id = ${todoId};`;

  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
