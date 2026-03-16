# 🛡️ Healer: Autonomous AI DevOps Monitoring System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go](https://img.shields.io/badge/Go-1.25+-00ADD8?logo=go&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15+-000000?logo=nextdotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

**Healer** is an end-to-end, multi-language observability and remediation pipeline. It uses a lightweight Go daemon to monitor host telemetry, a LangGraph AI agent to autonomously diagnose infrastructure anomalies, and a Next.js control room for human-in-the-loop (HITL) execution of AI-proposed bash remediations.

## 🧠 System Architecture

```mermaid
graph TD
    subgraph "Host Infrastructure"
        Logs[System Logs / test.log]
        Metrics[Hardware CPU / Memory]
    end

    subgraph "1. The Eyes: Daemon (Go)"
        GoSensor[Gin REST API :8080]
        Logs -->|Tails (nxadm/tail)| GoSensor
        Metrics -->|Reads (gopsutil)| GoSensor
    end

    subgraph "2. The Brain: AI Agent (Python)"
        MCP[FastMCP Server]
        LangGraph[LangGraph React Agent]
        LLM((Groq / Llama 3.3 70B))

        GoSensor -->|REST Fetch| MCP
        MCP <-->|Tool Calls| LangGraph
        LangGraph <--> LLM
    end

    subgraph "3. The Control Room: Dashboard (Next.js)"
        SQLite[(approvals.db - WAL Mode)]
        UI[React Telemetry UI :3000]
        Exec[Node.js child_process]

        MCP -->|Queues Proposed Fix| SQLite
        SQLite -->|Polls Pending State| UI
        UI -->|Human Approves| Exec
    end

    Exec -.->|Executes Bash Fix| Metrics
