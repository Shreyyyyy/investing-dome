const fs = require('fs');
async function run() {
  const save = await fetch("http://localhost:3000/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save_keys", username: "sterling", email: "sterling@heritage.club", name: "Sterling", groqKey: "new", tavilyKey: "new" })
  }).then(r => r.json());
  console.log("Save:", save);
}
run();
