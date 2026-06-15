import { NextRequest, NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";

let dbPromise: any = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(process.cwd(), "users.db"),
      driver: sqlite3.Database,
    }).then(async (db) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          password TEXT,
          name TEXT,
          email TEXT,
          tavilyKey TEXT,
          groqKey TEXT,
          avatar TEXT
        )
      `);
      
      // Migrate from users_db.json if it exists and table is empty
      try {
        const count = await db.get("SELECT COUNT(*) as count FROM users");
        if (count.count === 0) {
           const jsonPath = path.join(process.cwd(), "users_db.json");
           if (fs.existsSync(jsonPath)) {
             const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
             for (const u of data) {
               await db.run(
                 "INSERT INTO users (username, password, name, email, tavilyKey, groqKey, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)",
                 [u.username, u.password, u.name, u.email, u.tavilyKey, u.groqKey, u.avatar]
               );
             }
           }
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
      return db;
    });
  }
  return dbPromise;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, password, email, groqKey, tavilyKey, avatar, name } = body;

    const db = await getDB();

    if (action === "login") {
      const cleanUsername = (username || "").trim();
      const cleanPassword = (password || "").trim();

      if (!cleanUsername || !cleanPassword) {
        return NextResponse.json({ success: false, error: "Credentials are required." }, { status: 400 });
      }

      // Find user
      const matchedUser = await db.get(
        `SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(email) = ?`,
        [cleanUsername.toLowerCase(), cleanUsername.toLowerCase(), `${cleanUsername.toLowerCase()}@heritage.club`]
      );

      if (matchedUser) {
        // Validate password
        if (matchedUser.password !== cleanPassword) {
          return NextResponse.json({ success: false, error: "This username is already registered with a different password." }, { status: 400 });
        }
        return NextResponse.json({ success: true, user: matchedUser });
      } else {
        // Automatically register on the server!
        const uppercaseName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);
        const newUser = {
          username: cleanUsername,
          password: cleanPassword,
          name: uppercaseName,
          email: `${cleanUsername.toLowerCase()}@heritage.club`,
          tavilyKey: "tvly-sk-default-heritage-key",
          groqKey: "",
          avatar: cleanUsername.toLowerCase().includes("lady") || cleanUsername.toLowerCase().includes("abigail") ? "👒" : "🎩"
        };

        await db.run(
          "INSERT INTO users (username, password, name, email, tavilyKey, groqKey, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [newUser.username, newUser.password, newUser.name, newUser.email, newUser.tavilyKey, newUser.groqKey, newUser.avatar]
        );

        return NextResponse.json({ success: true, user: newUser, registered: true });
      }
    }

    if (action === "save_keys") {
      const cleanUsername = (username || "").trim();
      const cleanEmail = (email || "").trim();
      const cleanName = (name || "").trim();

      // Find user
      const matchedUser = await db.get(
        `SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(name) = ?`,
        [cleanUsername.toLowerCase(), cleanEmail.toLowerCase(), cleanName.toLowerCase()]
      );

      if (matchedUser) {
        const newGroq = groqKey !== undefined ? groqKey : matchedUser.groqKey;
        const newTavily = tavilyKey !== undefined ? tavilyKey : matchedUser.tavilyKey;
        
        await db.run(
          "UPDATE users SET groqKey = ?, tavilyKey = ? WHERE id = ?",
          [newGroq, newTavily, matchedUser.id]
        );
        
        matchedUser.groqKey = newGroq;
        matchedUser.tavilyKey = newTavily;
        
        return NextResponse.json({ success: true, user: matchedUser });
      } else {
        // Recover user
        const newUser = {
          username: cleanUsername || "unknown_user",
          password: "auto_generated_password",
          name: cleanName || cleanUsername || "Unknown",
          email: cleanEmail || `${cleanUsername || "unknown"}@heritage.club`,
          tavilyKey: tavilyKey || "tvly-sk-default-heritage-key",
          groqKey: groqKey || "",
          avatar: "🎩"
        };
        await db.run(
          "INSERT INTO users (username, password, name, email, tavilyKey, groqKey, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [newUser.username, newUser.password, newUser.name, newUser.email, newUser.tavilyKey, newUser.groqKey, newUser.avatar]
        );
        return NextResponse.json({ success: true, user: newUser, recovered: true });
      }
    }

    if (action === "get_all") {
      const users = await db.all("SELECT * FROM users");
      return NextResponse.json({ success: true, users });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
