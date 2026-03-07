package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/nxadm/tail"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
	"net/http"
	"sync"
	"time"
)

const MaxLogLine = 100

type LogBuffer struct {
	mu    sync.RWMutex
	lines []string
}

func (b *LogBuffer) Add(line string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.lines = append(b.lines, line)
	if len(b.lines) >= MaxLogLine {
		b.lines = b.lines[1:]
	}
}

func (b *LogBuffer) Get() []string {
	b.mu.RLock()
	defer b.mu.RUnlock()

	copyLines := make([]string, len(b.lines))
	copy(copyLines, b.lines)
	return copyLines
}

var appLogs = &LogBuffer{
	lines: make([]string, 0, MaxLogLine),
}

func tailLogs(filePath string) {
	t, err := tail.TailFile(filePath, tail.Config{
		Follow:    true,
		ReOpen:    true,
		MustExist: false,
		Location:  &tail.SeekInfo{Offset: 0, Whence: 2},
	})

	if err != nil {
		fmt.Println("Error tailing file:", err)
		return
	}

	for line := range t.Lines {
		appLogs.Add(line.Text)
	}
}

type SystemStats struct {
	CPUUsage    float64 `json:"cpu_usage"`
	MemoryUsage float64 `json:"memory_usage"`
}

func getHealthMetrics() SystemStats {
	v, _ := mem.VirtualMemory()
	c, _ := cpu.Percent(time.Second, false)

	cpuPercent := 0.0
	if len(c) > 0 {
		cpuPercent = c[0]
	}

	return SystemStats{
		CPUUsage:    cpuPercent,
		MemoryUsage: v.UsedPercent,
	}
}

func main() {
	go tailLogs("test.log")
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	router.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, getHealthMetrics())
	})

	router.GET("/api/v1/logs", func(c *gin.Context) {
		lines := appLogs.Get()
		c.JSON(http.StatusOK, gin.H{
			"count": len(lines),
			"logs":  lines,
		})
	})

	fmt.Println("🛡️  Healer Daemon running securely on 127.0.0.1:8080...")
	router.Run("127.0.0.1:8080")
}
