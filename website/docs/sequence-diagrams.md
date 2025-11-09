# Registration Flow Sequence Diagrams

## 1. Successful API Registration Flow

```
User → Frontend → API → Queue → Orchestrator → Connector → Manufacturer API
│       │         │      │        │              │           │
│ Submit registration   │        │              │           │
│──────►│               │        │              │           │
│       │ POST /api/    │        │              │           │
│       │  registration │        │              │           │
│       │──────────────►│        │              │           │
│       │               │        │              │           │
│       │               │ Create registration   │           │
│       │               │  record in DB         │           │
│       │               │───────►│              │           │
│       │               │        │              │           │
│       │               │ Queue job             │           │
│       │               │  (BullMQ)             │           │
│       │               │────────────────────►  │           │
│       │               │        │              │           │
│       │◄──registration ID─────────────────────┘           │
│◄──────│               │        │              │           │
│       │               │        │              │           │
│       │               │        │ Pick job     │           │
│       │               │        │ from queue   │           │
│       │               │        │◄─────────────┘           │
│       │               │        │              │           │
│       │               │        │ Load product & user data │
│       │               │        │ Validate data            │
│       │               │        │──────────────►│          │
│       │               │        │              │           │
│       │               │        │              │ Select connector
│       │               │        │              │ (Apple)   │
│       │               │        │              │           │
│       │               │        │              │ Check circuit breaker
│       │               │        │              │ Check rate limit
│       │               │        │              │           │
│       │               │        │              │ Map data  │
│       │               │        │              │           │
│       │               │        │              │ POST /register
│       │               │        │              │──────────►│
│       │               │        │              │           │
│       │               │        │              │◄──────────│
│       │               │        │              │ {confirmationCode}
│       │               │        │              │           │
│       │               │        │◄─────────────┘           │
│       │               │        │ SUCCESS                  │
│       │               │        │                          │
│       │               │        │ Update registration      │
│       │               │        │  status = SUCCESS        │
│       │               │        │ Record metrics           │
│       │               │        │ Send notification        │
│       │               │        │                          │
│◄──WebSocket/SSE──────────────────────────────────────────┘
│ Status update: SUCCESS
│ Confirmation: ABC123
```

## 2. API Failure → Web Automation Fallback Flow

```
User → Frontend → API → Queue → Orchestrator → API Connector → Web Automation → Website
│       │         │      │        │              │               │                │
│ Submit registration   │        │              │               │                │
│──────►│               │        │              │               │                │
│       │ POST /api/    │        │              │               │                │
│       │  registration │        │              │               │                │
│       │──────────────►│        │              │               │                │
│       │               │        │              │               │                │
│       │               │ Queue job             │               │                │
│       │               │────────────────────►  │               │                │
│       │               │        │              │               │                │
│       │               │        │ Try API first│               │                │
│       │               │        │──────────────►               │                │
│       │               │        │              │               │                │
│       │               │        │              │ POST /register│                │
│       │               │        │              │──────────────►│                │
│       │               │        │              │               │                │
│       │               │        │              │◄──────X─────  │                │
│       │               │        │              │ 503 Service   │                │
│       │               │        │              │ Unavailable   │                │
│       │               │        │◄─────────────┘               │                │
│       │               │        │ API FAILED                   │                │
│       │               │        │                              │                │
│       │               │        │ Circuit breaker trips        │                │
│       │               │        │                              │                │
│       │               │        │ Try fallback: Web Automation │                │
│       │               │        │──────────────────────────────►                │
│       │               │        │                              │                │
│       │               │        │                              │ Launch browser │
│       │               │        │                              │ Navigate to form
│       │               │        │                              │───────────────►│
│       │               │        │                              │                │
│       │               │        │                              │ Fill fields    │
│       │               │        │                              │───────────────►│
│       │               │        │                              │                │
│       │               │        │                              │ Submit form    │
│       │               │        │                              │───────────────►│
│       │               │        │                              │                │
│       │               │        │                              │◄───────────────│
│       │               │        │                              │ Success page   │
│       │               │        │                              │                │
│       │               │        │◄─────────────────────────────┘                │
│       │               │        │ SUCCESS (via automation)                      │
│       │               │        │                                              │
│       │               │        │ Update status = SUCCESS                       │
│       │               │        │ method = AUTOMATION_RELIABLE                  │
│       │               │        │                                              │
│◄──Notification─────────────────┘                                              │
│ Registration successful via web automation
```

## 3. All Methods Failed → Manual Assist Flow

```
User → Frontend → API → Queue → Orchestrator → Connectors → Manual Assist
│       │         │      │        │              │             │
│ Submit registration   │        │              │             │
│──────►│               │        │              │             │
│       │ POST /api/    │        │              │             │
│       │  registration │        │              │             │
│       │──────────────►│        │              │             │
│       │               │        │              │             │
│       │               │ Queue job             │             │
│       │               │────────────────────►  │             │
│       │               │        │              │             │
│       │               │        │ Attempt 1: API             │
│       │               │        │──────────────►│            │
│       │               │        │◄─────X────────┘            │
│       │               │        │ FAILED                     │
│       │               │        │                            │
│       │               │        │ Attempt 2: Web Automation  │
│       │               │        │──────────────►│            │
│       │               │        │◄─────X────────┘            │
│       │               │        │ FAILED (captcha/form change)
│       │               │        │                            │
│       │               │        │ Max retries reached        │
│       │               │        │                            │
│       │               │        │ Fallback to manual assist  │
│       │               │        │────────────────────────────►
│       │               │        │                            │
│       │               │        │                Generate PDF │
│       │               │        │                Pre-fill data│
│       │               │        │                Create email │
│       │               │        │                            │
│       │               │        │◄───────────────────────────┘
│       │               │        │                            │
│       │               │        │ Update status =            │
│       │               │        │  MANUAL_REQUIRED           │
│       │               │        │                            │
│       │               │        │ Send email with:           │
│       │               │        │ - Pre-filled PDF           │
│       │               │        │ - Step-by-step guide       │
│       │               │        │ - Registration URL         │
│       │               │        │                            │
│◄──Email────────────────────────┘                            │
│ Manual action required
│ PDF attached with your info
│
│ User completes manually
│       │
│ Mark as completed
│──────►│
│       │ POST /api/registration/{id}/complete
│       │──────────────►│
│       │               │
│       │               │ Update status = USER_COMPLETED
│       │               │
│       │◄──────────────┘
│ Confirmed!
```

## 4. Queue Processing Flow (BullMQ)

```
Queue → Worker → Orchestrator → Connector
│        │        │              │
│ Jobs queued by priority        │
│ - High: Premium users          │
│ - Normal: Regular users        │
│ - Low: Bulk imports            │
│        │        │              │
│ Worker polls queue             │
│───────►│        │              │
│        │        │              │
│        │ Pick next job         │
│        │ (priority order)      │
│        │        │              │
│        │ Process registration  │
│        │───────►│              │
│        │        │              │
│        │        │ Load data    │
│        │        │ Select connector
│        │        │──────────────►
│        │        │              │
│        │        │ Execute      │
│        │        │◄─────────────┘
│        │        │              │
│        │◄───────┘              │
│        │ Result                │
│        │        │              │
│        │ Job complete          │
│        │ Update metrics        │
│        │ Notify user           │
│◄───────┘        │              │
│ Remove from queue              │
│        │        │              │
│ Continue polling               │
│───────►│        │              │
│        │        │              │
```

## 5. Circuit Breaker State Transitions

```
CLOSED (Normal Operation)
│
│ Failures < Threshold
│────────────────────┐
│                    │
│                    │ Success
│                    └─────────►CLOSED
│
│ Failures >= Threshold (e.g., 5)
│
▼
OPEN (Reject all requests)
│
│ Wait timeout (e.g., 60s)
│
▼
HALF_OPEN (Test with 1 request)
│
├─► Success ──────────────────► CLOSED
│   (and next N successes)
│
└─► Failure ──────────────────► OPEN
    (back to waiting)

Example Timeline:

00:00 │ CLOSED  │ Request 1 → Success
00:05 │ CLOSED  │ Request 2 → Success
00:10 │ CLOSED  │ Request 3 → Failure (count: 1)
00:15 │ CLOSED  │ Request 4 → Failure (count: 2)
00:20 │ CLOSED  │ Request 5 → Failure (count: 3)
00:25 │ CLOSED  │ Request 6 → Failure (count: 4)
00:30 │ CLOSED  │ Request 7 → Failure (count: 5)
      │         │ THRESHOLD REACHED!
      ▼
00:30 │ OPEN    │ All requests rejected
00:35 │ OPEN    │ Rejected
00:40 │ OPEN    │ Rejected
      │         │ ...60 seconds elapsed...
      ▼
01:30 │ HALF_OPEN│ Request 8 → Success (count: 1)
01:35 │ HALF_OPEN│ Request 9 → Success (count: 2)
01:40 │ HALF_OPEN│ Request 10 → Success (count: 3)
      │         │ SUCCESS THRESHOLD REACHED!
      ▼
01:40 │ CLOSED  │ Normal operation resumed
```

## 6. Rate Limiting Flow (Token Bucket)

```
Time → Tokens
│
│ Start: 100 tokens available
│      (100 requests/minute)
│
00:00  [████████████████████] 100/100
│      Request 1 → Acquire token
│      └─► Execute immediately
│
00:01  [███████████████████ ] 99/100
│      Request 2 → Acquire token
│      └─► Execute immediately
│
00:02  [██████████████████  ] 98/100
│      ...50 more requests...
│
00:30  [████████            ] 48/100
│      Request 53 → Acquire token
│      └─► Execute immediately
│
00:59  [                    ] 0/100
│      Request 101 → No tokens!
│      └─► Wait 1 second for refill
│
01:00  [████████████████████] 100/100
│      Tokens refilled!
│      Request 101 → Acquire token
│      └─► Execute immediately
│
```

## 7. Monitoring Dashboard Data Flow

```
Connectors → Metrics Collector → Database → Dashboard API → Frontend
│            │                   │          │               │
│ Record     │                   │          │               │
│ attempt    │                   │          │               │
│───────────►│                   │          │               │
│            │                   │          │               │
│            │ Aggregate metrics │          │               │
│            │  - Success rate   │          │               │
│            │  - Latency (p50, p95, p99)   │               │
│            │  - Error breakdown│          │               │
│            │  - Circuit state  │          │               │
│            │                   │          │               │
│            │ Store in DB       │          │               │
│            │──────────────────►│          │               │
│            │                   │          │               │
│            │                   │          │ GET /analytics│
│            │                   │          │◄──────────────│
│            │                   │          │               │
│            │                   │ Query    │               │
│            │                   │◄─────────┘               │
│            │                   │          │               │
│            │                   │ Return   │               │
│            │                   │──────────►               │
│            │                   │          │               │
│            │                   │          │ Format for UI │
│            │                   │          │──────────────►│
│            │                   │          │               │
│            │                   │          │               │ Display:
│            │                   │          │               │ - Health cards
│            │                   │          │               │ - Success charts
│            │                   │          │               │ - Latency graphs
│            │                   │          │               │ - Alert badges
```

## 8. Health Check Flow

```
Scheduler → Registry → Connectors → External Services
│           │          │            │
│ Cron job every 5 min│            │
│──────────►│          │            │
│           │          │            │
│           │ For each connector    │
│           │──────────►│           │
│           │          │            │
│           │          │ Health check
│           │          │───────────►│
│           │          │            │
│           │          │◄───────────│
│           │          │ Status     │
│           │          │            │
│           │◄─────────┘            │
│           │ Result                │
│           │          │            │
│           │ Update cache          │
│           │ Record metric         │
│           │          │            │
│           │ Check thresholds      │
│           │          │            │
│           │ If unhealthy:         │
│           │ - Send alert          │
│           │ - Log incident        │
│           │ - Update dashboard    │
│           │          │            │
│◄──────────┘          │            │
│ Complete             │            │
```
