# Notifications Module Guide

## Overview

The notifications module in Distribution Registry allows you to send webhook notifications about registry events (pushes, pulls, deletes) to external endpoints. This is useful for:

- **CI/CD Integration**: Trigger builds when new images are pushed
- **Security Scanning**: Automatically scan new images for vulnerabilities
- **Monitoring**: Track registry activity and usage
- **Audit Logging**: Record all registry operations to external systems

## How Notifications Work

The notifications module uses an event-driven architecture:

1. **Events**: Registry operations (push, pull, delete) generate events
2. **Bridge**: Converts registry operations into notification events
3. **Sinks**: Deliver events to configured endpoints (HTTP webhooks)
4. **Broadcaster**: Sends events to multiple endpoints simultaneously

## Configuration

Configure notifications in your registry configuration file:

```yaml
version: 0.1

storage:
  filesystem:
    rootdirectory: /var/lib/registry

http:
  addr: :5000

# Notifications configuration
notifications:
  events:
    includereferences: true
  endpoints:
    - name: webhook-endpoint
      url: https://your-webhook-endpoint.com/registry-events
      headers:
        Authorization: [Bearer your-secret-token]
      timeout: 5s
      threshold: 5
      backoff: 1s
      ignoredmediatypes:
        - application/octet-stream
      ignore:
        mediatypes:
          - application/octet-stream
        actions:
          - pull
```

### Configuration Parameters

- **`name`**: Identifier for the endpoint
- **`url`**: HTTP/HTTPS webhook URL to receive events
- **`headers`**: Custom HTTP headers (e.g., authentication)
- **`timeout`**: Request timeout duration (default: 1s)
- **`threshold`**: Retry attempts before giving up (default: 10)
- **`backoff`**: Initial backoff duration for retries (default: 1s)
- **`ignoredmediatypes`**: Media types to ignore
- **`ignore`**: Fine-grained filtering of events

## Event Types

The registry generates events for these actions:

### Manifest Events
- **`push`**: When a manifest is pushed to the registry
- **`pull`**: When a manifest is pulled from the registry
- **`delete`**: When a manifest is deleted

### Blob Events
- **`push`**: When a blob is pushed
- **`pull`**: When a blob is pulled
- **`delete`**: When a blob is deleted (if delete is enabled)
- **`mount`**: When a blob is mounted from another repository

## Event Payload

Events are sent as JSON HTTP POST requests:

```json
{
  "id": "asdf-asdf-asdf-asdf",
  "timestamp": "2006-01-02T15:04:05Z",
  "action": "push",
  "target": {
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "digest": "sha256:c0537ff6a5218ef531ece93d4984efc99bbf3f7497c0a7726c88e2bb7584dc96",
    "size": 3253,
    "length": 3253,
    "repository": "library/myapp",
    "url": "http://localhost:5000/v2/library/myapp/manifests/sha256:c0537ff6a5218ef531ece93d4984efc99bbf3f7497c0a7726c88e2bb7584dc96",
    "tag": "latest"
  },
  "request": {
    "id": "123-456-789",
    "addr": "192.168.1.100:54321",
    "host": "localhost:5000",
    "method": "PUT",
    "useragent": "docker/24.0.0"
  },
  "actor": {
    "name": "username"
  },
  "source": {
    "addr": "localhost:5000",
    "instanceID": "instance-id-123"
  }
}
```

## Use Cases

### 1. Trigger CI/CD Pipeline

When a new image is pushed, trigger a deployment:

```python
# Webhook receiver example (Flask)
from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route('/registry-events', methods=['POST'])
def handle_registry_event():
    event = request.json
    
    if event['action'] == 'push' and event['target'].get('tag') == 'latest':
        repository = event['target']['repository']
        
        # Trigger deployment
        subprocess.run(['kubectl', 'rollout', 'restart', 
                       f'deployment/{repository}'])
        
        return {'status': 'deployed'}, 200
    
    return {'status': 'ignored'}, 200
```

### 2. Security Scanning

Automatically scan pushed images for vulnerabilities:

```javascript
// Node.js webhook receiver
const express = require('express');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

app.post('/registry-events', (req, res) => {
    const event = req.body;
    
    if (event.action === 'push') {
        const imageRef = `${event.request.host}/${event.target.repository}@${event.target.digest}`;
        
        // Scan with Trivy
        exec(`trivy image ${imageRef}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Scan failed: ${error}`);
                return;
            }
            console.log(`Scan results: ${stdout}`);
        });
    }
    
    res.status(200).json({ status: 'processed' });
});

app.listen(3000);
```

### 3. Audit Logging

Log all registry operations to a central logging system:

```go
// Go webhook receiver
package main

import (
    "encoding/json"
    "log"
    "net/http"
)

type RegistryEvent struct {
    ID        string `json:"id"`
    Timestamp string `json:"timestamp"`
    Action    string `json:"action"`
    Target    struct {
        Repository string `json:"repository"`
        Tag        string `json:"tag"`
        Digest     string `json:"digest"`
    } `json:"target"`
    Request struct {
        Addr      string `json:"addr"`
        UserAgent string `json:"useragent"`
    } `json:"request"`
}

func handleEvent(w http.ResponseWriter, r *http.Request) {
    var event RegistryEvent
    if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    // Log to your audit system
    log.Printf("[AUDIT] %s: %s %s:%s from %s",
        event.Timestamp,
        event.Action,
        event.Target.Repository,
        event.Target.Tag,
        event.Request.Addr,
    )
    
    w.WriteHeader(http.StatusOK)
}

func main() {
    http.HandleFunc("/registry-events", handleEvent)
    log.Fatal(http.Listen AndServe(":8080", nil))
}
```

## Multiple Endpoints

You can configure multiple webhook endpoints:

```yaml
notifications:
  endpoints:
    - name: slack-notifications
      url: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
      headers:
        Content-Type: [application/json]
      
    - name: security-scanner
      url: https://security.example.com/scan
      headers:
        Authorization: [Bearer scanner-token]
      ignore:
        actions:
          - pull  # Only scan on push
    
    - name: audit-log
      url: https://audit.example.com/registry
      headers:
        Authorization: [Bearer audit-token]
```

## Filtering Events

### Ignore Specific Actions

```yaml
notifications:
  endpoints:
    - name: push-only
      url: https://example.com/webhook
      ignore:
        actions:
          - pull  # Ignore pull events
```

### Ignore Media Types

```yaml
notifications:
  endpoints:
    - name: manifest-only
      url: https://example.com/webhook
      ignoredmediatypes:
        - application/octet-stream  # Ignore blob events
```

## Error Handling and Retries

The notification system includes automatic retry logic:

- **Threshold**: Maximum number of retry attempts
- **Backoff**: Exponential backoff between retries
- **Timeout**: Request timeout for each attempt

Example configuration:

```yaml
notifications:
  endpoints:
    - name: reliable-endpoint
      url: https://example.com/webhook
      timeout: 5s
      threshold: 10  # Retry up to 10 times
      backoff: 2s    # Start with 2s, exponentially increase
```

## Storage Cache

The registry also includes a storage cache system that caches blob metadata to improve performance:

### Redis Cache

```yaml
storage:
  filesystem:
    rootdirectory: /var/lib/registry
  cache:
    blobdescriptor: redis

redis:
  addr: localhost:6379
  password: ""
  db: 0
  dialtimeout: 10ms
  readtimeout: 10ms
  writetimeout: 10ms
  pool:
    maxidle: 16
    maxactive: 64
    idletimeout: 300s
```

### In-Memory Cache

```yaml
storage:
  cache:
    blobdescriptor: inmemory
    blobdescriptorsize: 10000  # Max items to cache
```

## Monitoring Notifications

Check registry logs for notification delivery status:

```bash
# Successful delivery
INFO[0123] notification sent  endpoint=webhook-endpoint repository=myapp action=push

# Failed delivery (will retry)
WARN[0124] notification failed  endpoint=webhook-endpoint error="connection timeout"

# Delivery abandoned after retries
ERROR[0125] notification dropped  endpoint=webhook-endpoint attempts=10
```

## Best Practices

1. **Authentication**: Always use authentication headers for webhooks
2. **HTTPS**: Use HTTPS endpoints for security
3. **Timeout**: Set reasonable timeouts (5-10s recommended)
4. **Filtering**: Use filters to reduce unnecessary notifications
5. **Idempotency**: Make webhook receivers idempotent (handle duplicate events)
6. **Monitoring**: Monitor webhook endpoint availability
7. **Rate Limiting**: Implement rate limiting on webhook receivers

## Troubleshooting

### Notifications Not Received

1. Check registry logs for errors
2. Verify endpoint URL is accessible from registry
3. Test endpoint with curl:
   ```bash
   curl -X POST https://your-endpoint.com/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "event"}'
   ```
4. Check firewall rules and network connectivity
5. Verify authentication headers are correct

### Too Many Notifications

1. Use filters to ignore unwanted events
2. Increase endpoint timeout if connection is slow
3. Consider batching events in your receiver

### Notifications Delayed

1. Check backoff and retry settings
2. Increase endpoint timeout
3. Monitor endpoint performance
4. Consider using message queue for buffering

## Related Documentation

- [Configuration Reference](https://distribution.github.io/distribution/about/configuration/)
- [Web Management Interface](./web-management.md)
- [Storage Drivers](https://distribution.github.io/distribution/storage-drivers/)
