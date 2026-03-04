import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("dealership.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'dealer123',
    status TEXT DEFAULT 'available'
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    interest TEXT,
    status TEXT DEFAULT 'new',
    agent_id INTEGER,
    history TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'scheduled',
    FOREIGN KEY(lead_id) REFERENCES leads(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lead_id) REFERENCES leads(id)
  );
`);

// Migration: Add history column if it doesn't exist
try {
  db.prepare("ALTER TABLE leads ADD COLUMN history TEXT").run();
} catch (e) {}

// Migration: Add notes column if it doesn't exist
try {
  db.prepare("ALTER TABLE leads ADD COLUMN notes TEXT").run();
} catch (e) {}

// Migration: Add leadSource column if it doesn't exist
try {
  db.prepare("ALTER TABLE leads ADD COLUMN leadSource TEXT DEFAULT 'Website'").run();
} catch (e) {}

// Migration: Add password column to agents if it doesn't exist
try {
  db.prepare("ALTER TABLE agents ADD COLUMN password TEXT NOT NULL DEFAULT 'dealer123'").run();
} catch (e) {}

// Seed initial agents if empty
const agentCount = db.prepare("SELECT COUNT(*) as count FROM agents").get() as { count: number };
if (agentCount.count === 0) {
  const insertAgent = db.prepare("INSERT INTO agents (name, email) VALUES (?, ?)");
  insertAgent.run("Alex Miller", "alex@autogenius.com");
  insertAgent.run("Sarah Chen", "sarah@autogenius.com");
  insertAgent.run("Jordan Smith", "jordan@autogenius.com");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const agent = db.prepare("SELECT * FROM agents WHERE email = ? AND password = ?").get(email, password) as any;
    
    if (agent) {
      const { password, ...agentWithoutPassword } = agent;
      res.json({ success: true, agent: agentWithoutPassword });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  });

  app.get("/api/agents", (req, res) => {
    const agents = db.prepare(`
      SELECT agents.*, 
      (SELECT COUNT(*) FROM leads WHERE leads.agent_id = agents.id AND leads.status != 'closed') as leadCount 
      FROM agents
    `).all();
    res.json(agents);
  });

  app.get("/api/leads", (req, res) => {
    const leads = db.prepare(`
      SELECT leads.*, agents.name as agent_name 
      FROM leads 
      LEFT JOIN agents ON leads.agent_id = agents.id
      ORDER BY created_at DESC
    `).all();
    res.json(leads);
  });

  app.post("/api/leads", (req, res) => {
    const { name, email, phone, interest, history } = req.body;
    
    // Simple round-robin or random agent assignment
    const agents = db.prepare("SELECT id FROM agents WHERE status = 'available'").all() as { id: number }[];
    const agentId = agents.length > 0 ? agents[Math.floor(Math.random() * agents.length)].id : null;

    const info = db.prepare(
      "INSERT INTO leads (name, email, phone, interest, agent_id, history) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(name, email, phone, interest, agentId, history ? JSON.stringify(history) : null);
    
    res.json({ id: info.lastInsertRowid, agentId });
  });

  app.patch("/api/leads/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  app.patch("/api/leads/:id/assign", (req, res) => {
    const { id } = req.params;
    const { agentId } = req.body;
    db.prepare("UPDATE leads SET agent_id = ? WHERE id = ?").run(agentId, id);
    res.json({ success: true });
  });

  app.patch("/api/leads/:id/notes", (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    db.prepare("UPDATE leads SET notes = ? WHERE id = ?").run(notes, id);
    res.json({ success: true });
  });

  app.post("/api/leads/:id/documents", (req, res) => {
    const { id } = req.params;
    const { name, type, url } = req.body;
    const info = db.prepare(
      "INSERT INTO documents (lead_id, name, type, url) VALUES (?, ?, ?, ?)"
    ).run(id, name, type, url || 'https://example.com/mock-doc.pdf');
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/leads/:id/documents", (req, res) => {
    const { id } = req.params;
    const docs = db.prepare("SELECT * FROM documents WHERE lead_id = ?").all(id);
    res.json(docs);
  });

  app.get("/api/appointments", (req, res) => {
    const appointments = db.prepare(`
      SELECT appointments.*, leads.name as lead_name, leads.interest
      FROM appointments
      JOIN leads ON appointments.lead_id = leads.id
      ORDER BY date ASC, time ASC
    `).all();
    res.json(appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const { leadId, date, time, notes } = req.body;
    const info = db.prepare(
      "INSERT INTO appointments (lead_id, date, time, notes) VALUES (?, ?, ?, ?)"
    ).run(leadId, date, time, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/appointments/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../dist", "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
