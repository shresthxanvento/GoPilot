FROM node:20-slim
WORKDIR /GoPilot/dashboard

# Install required build tools for SQLite and native bindings on Debian
RUN apt-get update && apt-get install -y sqlite3 python3 make g++ && rm -rf /var/lib/apt/lists/*

# The wildcard ensures it copies package-lock.json ONLY if it exists
COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]