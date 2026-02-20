import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("bank.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS KodUser (
    uid TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    balance REAL DEFAULT 100000,
    phone TEXT,
    role TEXT CHECK(role IN ('Customer', 'Manager', 'Admin'))
  );

  CREATE TABLE IF NOT EXISTS UserToken (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    uid TEXT NOT NULL,
    expiry INTEGER NOT NULL,
    FOREIGN KEY(uid) REFERENCES KodUser(uid)
  );
`);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_me";

app.use(express.json());
app.use(cookieParser());

// API Routes
app.post("/api/register", (req, res) => {
  const { uid, uname, password, email, phone, role } = req.body;
  
  if (!uid || !uname || !password || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const stmt = db.prepare(
      "INSERT INTO KodUser (uid, username, password, email, phone, role, balance) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run(uid, uname, password, email, phone, role || 'Customer', 100000);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: "Username or UID already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare("SELECT * FROM KodUser WHERE username = ? AND password = ?").get(username, password) as any;

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign(
    { username: user.username, role: user.role, uid: user.uid },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const expiry = Math.floor(Date.now() / 1000) + 3600;

  // Store token in DB
  db.prepare("INSERT INTO UserToken (token, uid, expiry) VALUES (?, ?, ?)").run(token, user.uid, expiry);

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 3600000, // 1 hour
  });

  res.json({ message: "Login successful", role: user.role });
});

app.get("/api/balance", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify token exists in DB and not expired
    const tokenRecord = db.prepare("SELECT * FROM UserToken WHERE token = ?").get(token) as any;
    if (!tokenRecord) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const user = db.prepare("SELECT balance FROM KodUser WHERE username = ?").get(decoded.username) as any;
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ balance: user.balance });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/api/logout", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    db.prepare("DELETE FROM UserToken WHERE token = ?").run(token);
  }
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Logged out" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
