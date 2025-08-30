import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";
import { v4 as uuid } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// --- Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- EJS + Layouts
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); // views/layout.ejs

// --- Simple file-based store
const DATA_PATH = path.join(__dirname, "data", "tasks.json");

function readTasks() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(tasks, null, 2));
}

// --- Web route
app.get("/", (req, res) => {
  const tasks = readTasks();
  res.render("index", { tasks });
});

// --- REST API
// Create
app.post("/api/tasks", (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  const tasks = readTasks();
  const newTask = { id: uuid(), title: title.trim(), done: false, createdAt: Date.now() };
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// Toggle done
app.patch("/api/tasks/:id/toggle", (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.done = !task.done;
  writeTasks(tasks);
  res.json(task);
});

// Delete
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  let tasks = readTasks();
  const prevLen = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  if (tasks.length === prevLen) return res.status(404).json({ error: "Task not found" });
  writeTasks(tasks);
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
