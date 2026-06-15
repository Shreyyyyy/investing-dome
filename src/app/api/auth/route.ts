import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "users_db.json");

// Helper to read database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return [];
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data || "[]");
  } catch (e) {
    console.error("Error reading users_db.json:", e);
    return [];
  }
}

// Helper to write database
function writeDB(data: any[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing users_db.json:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, password, email, groqKey, tavilyKey, avatar, name } = body;

    const db = readDB();

    if (action === "login") {
      const cleanUsername = (username || "").trim();
      const cleanPassword = (password || "").trim();

      if (!cleanUsername || !cleanPassword) {
        return NextResponse.json({ success: false, error: "Credentials are required." }, { status: 400 });
      }

      // Find user
      let matchedUser = db.find(
        (u: any) =>
          u.username?.toLowerCase() === cleanUsername.toLowerCase() ||
          u.email?.toLowerCase() === cleanUsername.toLowerCase() ||
          u.email?.toLowerCase() === `${cleanUsername.toLowerCase()}@heritage.club`
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

        db.push(newUser);
        writeDB(db);

        return NextResponse.json({ success: true, user: newUser, registered: true });
      }
    }

    if (action === "save_keys") {
      const cleanUsername = (username || "").trim();
      const cleanEmail = (email || "").trim();
      const cleanName = (name || "").trim();

      // Find user in DB by any identifier
      let userIdx = db.findIndex((u: any) => {
        const uUsername = u.username?.toLowerCase() || "";
        const sUsername = cleanUsername.toLowerCase();
        const uEmail = u.email?.toLowerCase() || "";
        const sEmail = cleanEmail.toLowerCase();
        const uName = u.name?.toLowerCase() || "";
        const sName = cleanName.toLowerCase();

        return (
          (uUsername && sUsername && uUsername === sUsername) ||
          (uEmail && sEmail && uEmail === sEmail) ||
          (uName && sName && uName === sName)
        );
      });

      if (userIdx !== -1) {
        db[userIdx].groqKey = groqKey !== undefined ? groqKey : db[userIdx].groqKey;
        db[userIdx].tavilyKey = tavilyKey !== undefined ? tavilyKey : db[userIdx].tavilyKey;
        writeDB(db);
        return NextResponse.json({ success: true, user: db[userIdx] });
      } else {
        return NextResponse.json({ success: false, error: "User not found in database." }, { status: 404 });
      }
    }

    if (action === "get_all") {
      return NextResponse.json({ success: true, users: db });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
