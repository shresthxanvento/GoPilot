import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

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
    db.run("UPDATE pending_fixes SET status = ? WHERE id = ?", [action, id], function(err) {
      db.close();
      if (err) return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      resolve(NextResponse.json({ success: true }));
    });
  });
}