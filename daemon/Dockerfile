FROM golang:1.25.5-alpine
WORKDIR /GoPilot/daemon

# Install build tools for Go
RUN apk add --no-cache build-base

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Run the live code directly, which works perfectly with volume mounts!
CMD ["go", "run", "main.go"]