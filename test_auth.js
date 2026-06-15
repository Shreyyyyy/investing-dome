const fs = require('fs');
if (fs.existsSync('users_db.json')) fs.unlinkSync('users_db.json');
async function run() {
  const login1 = await fetch("http://localhost:3000/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username: "testuser", password: "pwd" })
  }).then(r => r.json());
  console.log("Login 1:", login1);

  const save = await fetch("http://localhost:3000/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save_keys", username: "testuser", groqKey: "my_groq_key", tavilyKey: "my_tavily_key" })
  }).then(r => r.json());
  console.log("Save:", save);

  const login2 = await fetch("http://localhost:3000/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username: "testuser", password: "pwd" })
  }).then(r => r.json());
  console.log("Login 2:", login2);
}
run();
