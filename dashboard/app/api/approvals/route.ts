import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';
import {exec} from 'child_process'

const dbPath = path.resolve(process.cwd(), '../mcp-server/approvals.db');

export async function GET() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath);
    db.all("SELECT * FROM pending_fixes ORDER BY id DESC", [], (err, rows: any[]) => {
      db.close();
      if (err) return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      
      const pending = rows.filter(r => r.status === 'PENDING');
      const history = rows.filter(r => r.status !== 'PENDING').slice(0, 5);
      const approvedCount = rows.filter(r => r.status === 'APPROVED').length;
      const rejectedCount = rows.filter(r => r.status === 'REJECTED').length;
      
      resolve(NextResponse.json({ pending, history, approvedCount, rejectedCount }));
    });
  });
}

export async function POST(req: Request) {
  const { id, action } = await req.json();
  
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath);
    
    db.get("SELECT command FROM pending_fixes WHERE id = ?", [id], (err, row: any) => {
      if (err || !row) {
          db.close();
          return resolve(NextResponse.json({ error: "Command not found" }, { status: 404 }));
      }

      if (action === 'APPROVED') {
        // SECURITY NOTE: In a production environment, executing arbitrary database 
        // strings via exec() is an RCE vulnerability. An enterprise version of this 
        // would use a strict AllowList of commands or execute inside a sandboxed worker.
        console.log(`🚀 Executing command: ${row.command}`);
        exec(row.command, (execError, stdout, stderr) => {
          if (execError) console.error(`Execution failed: ${stderr}`);
          else console.log(`Execution success: ${stdout}`);
        });
      }

      db.run("UPDATE pending_fixes SET status = ? WHERE id = ?", [action, id], function(updateErr) {
        db.close();
        if (updateErr) return resolve(NextResponse.json({ error: updateErr.message }, { status: 500 }));
        resolve(NextResponse.json({ success: true }));
      });
    });
  });
}