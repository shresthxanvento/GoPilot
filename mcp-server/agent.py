import asyncio
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

system_message = """You are an elite autonomous DevOps AI. 
Your job is to monitor system health and read logs to find anomalies, then propose a bash command to fix them.
Step 1: ALWAYS use the 'get_system_health' tool.
Step 2: ALWAYS use the 'get_recent_logs' tool to check for 'ERROR', 'WARN', or 'CRITICAL' tags.
Step 3: If you see a critical error in the logs or high resource usage, use 'propose_fix' to queue a safe bash command to resolve the issue.
If the health is fine AND the logs are clean, respond with 'System Stable'."""

async def run_healer_loop():
    client = MultiServerMCPClient({
        "healer-bridge": {
            "command": "uv",
            "args": ["run", "--with", "mcp", "mcp", "run", "server.py"],
            "transport": "stdio"
        }
    })
    
    tools = await client.get_tools()
    
    agent = create_react_agent(llm, tools)
    
    print("🤖 AI DevOps Healer is online. Monitoring system...")
    
    while True:
        print("\n--- Running Health Check ---")
        try:
            result = await agent.ainvoke({
                "messages": [
                    ("system", system_message),
                    ("user", "Check the system health. If everything is fine, just say 'System Stable'. If not, diagnose and propose a fix.")
                ]
            })
            
            raw_content = result["messages"][-1].content

            if isinstance(raw_content, list):
                final_answer = raw_content[0].get("text", "")
            else:
                final_answer = raw_content
            
            print(f"🤖 Agent says: {final_answer}")
            
        except Exception as e:
            print(f"Agent encountered an error: {e}")
        
        await asyncio.sleep(30)

if __name__ == "__main__":
    asyncio.run(run_healer_loop())