import sqlite3
import requests
from mcp.server.fastmcp import FastMCP

#1. Initialise a MCP Server
mcp = FastMCP("Healer Bridge")
DAEMON_URL = "http://localhost:8080"

#2. Setup secure queue for fixes
def init_db():
    conn = sqlite3.connect("approvals.db")
    cursor = conn.cursor()
    cursor.execute('PRAGMA journal_mode=WAL;')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pending_fixes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            command TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING'
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# 3. Tool: Check System Health
@mcp.tool()
def get_system_health() -> str:
    """Fetch current CPU and Memory usage from the local monitoring daemon."""
    try:
        response = requests.get(f"{DAEMON_URL}/api/v1/health")
        response.raise_for_status()
        data = response.json()
        
        # Extract using the exact keys from your Go daemon and round to 2 decimals
        cpu = round(data["cpu_usage"], 2)
        mem = round(data["memory_usage"], 2)
        
        return f"CPU Usage: {cpu}%\nMemory Usage: {mem}%"
    except Exception as e:
        return f"Error connecting to daemon: {str(e)}"

# 4. Read Logs
@mcp.tool()
def get_recent_logs() -> str:
    """Fetch the last 100 lines of system logs to diagnose anomalies."""
    try:
        response = requests.get(f"{DAEMON_URL}/api/v1/logs")
        response.raise_for_status()
        data = response.json()
        logs = "\n".join(data["logs"])
        return f"Recent Logs:\n{logs}"
    except Exception as e:
        return f"Error connecting to daemon logs: {str(e)}"

# 5. Tool: Propose a fix
@mcp.tool()
def propose_fix(command: str) -> str:
    """
    Propose a bash command to fix a diagnosed infrastructure issue.
    The command will NOT execute immediately; it goes to a queue for human approval.
    """
    try:
        conn = sqlite3.connect("approvals.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO pending_fixes (command) VALUES (?)", (command,))
        conn.commit()
        conn.close()
        return f"Successfully proposed command '{command}'. It is now pending human approval."
    except Exception as e:
        return f"Error queuing the fix: {str(e)}"

if __name__ == "__main__":
    mcp.run()

