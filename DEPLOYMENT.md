# Registry Deployment Guide

This guide covers deploying the Distribution Registry with the web management interface.

## Prerequisites

- **Go 1.21+** for building the registry
- **Node.js 20+** and npm for building the frontend
- **Storage backend** (filesystem, S3, Azure Blob, or GCS)
- **Domain name** (recommended for production)
- **TLS certificates** (for HTTPS)

## Quick Start

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

This builds the Next.js app and outputs to `registry/api/web/static`.

### 2. Build the Registry

```bash
make binaries
```

This creates `bin/registry` with the embedded frontend.

### 3. Configure the Registry

Create `config.yml`:

```yaml
version: 0.1

log:
  level: info

storage:
  filesystem:
    rootdirectory: /var/lib/registry

http:
  addr: :5000
  secret: CHANGE_THIS_SECRET

# Enable web management
webmanagement:
  enabled: true
```

### 4. Run the Registry

```bash
./bin/registry serve config.yml
```

Access:
- **Web UI**: http://localhost:5000/
- **Docker API**: http://localhost:5000/v2/

## Production Deployment

### Option 1: Docker

Create `Dockerfile`:

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /build

# Build frontend
COPY frontend/ frontend/
RUN apk add --no-cache nodejs npm && \
    cd frontend && npm install && npm run build && cd ..

# Build registry
COPY . .
RUN go build -o registry ./cmd/registry

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /build/registry /bin/registry
EXPOSE 5000
ENTRYPOINT ["/bin/registry"]
CMD ["serve", "/etc/registry/config.yml"]
```

Build and run:

```bash
docker build -t my-registry .
docker run -d -p 5000:5000 \
  -v /path/to/config.yml:/etc/registry/config.yml \
  -v /path/to/data:/var/lib/registry \
  my-registry
```

### Option 2: Kubernetes

Create `deployment.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: registry-config
data:
  config.yml: |
    version: 0.1
    log:
      level: info
    storage:
      filesystem:
        rootdirectory: /var/lib/registry
    http:
      addr: :5000
      secret: YOUR_SECRET_HERE
    webmanagement:
      enabled: true
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: registry
spec:
  replicas: 1
  selector:
    matchLabels:
      app: registry
  template:
    metadata:
      labels:
        app: registry
    spec:
      containers:
      - name: registry
        image: my-registry:latest
        ports:
        - containerPort: 5000
        volumeMounts:
        - name: config
          mountPath: /etc/registry
        - name: data
          mountPath: /var/lib/registry
      volumes:
      - name: config
        configMap:
          name: registry-config
      - name: data
        persistentVolumeClaim:
          claimName: registry-data
---
apiVersion: v1
kind: Service
metadata:
  name: registry
spec:
  selector:
    app: registry
  ports:
  - port: 5000
    targetPort: 5000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f deployment.yaml
```

### Option 3: Systemd Service

Create `/etc/systemd/system/registry.service`:

```ini
[Unit]
Description=Distribution Registry
After=network.target

[Service]
Type=simple
User=registry
Group=registry
ExecStart=/usr/local/bin/registry serve /etc/registry/config.yml
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable registry
sudo systemctl start registry
sudo systemctl status registry
```

## Configuration

### Minimal Configuration

```yaml
version: 0.1

storage:
  filesystem:
    rootdirectory: /var/lib/registry

http:
  addr: :5000

webmanagement:
  enabled: true
```

### Production Configuration

```yaml
version: 0.1

log:
  level: info
  formatter: json

storage:
  s3:
    accesskey: YOUR_ACCESS_KEY
    secretkey: YOUR_SECRET_KEY
    region: us-east-1
    bucket: my-registry-bucket
  cache:
    blobdescriptor: redis

redis:
  addr: redis:6379
  password: ""
  db: 0

http:
  addr: :5000
  secret: CHANGE_THIS_LONG_RANDOM_SECRET
  tls:
    certificate: /etc/registry/certs/cert.pem
    key: /etc/registry/certs/key.pem

auth:
  htpasswd:
    realm: Registry
    path: /etc/registry/htpasswd

webmanagement:
  enabled: true

notifications:
  endpoints:
    - name: webhook
      url: https://webhook.example.com/registry
      timeout: 5s
      threshold: 5
      backoff: 1s
```

## HTTPS Setup

### Using Let's Encrypt

1. Install certbot:
```bash
sudo apt-get install certbot
```

2. Get certificates:
```bash
sudo certbot certonly --standalone -d registry.example.com
```

3. Update config:
```yaml
http:
  tls:
    certificate: /etc/letsencrypt/live/registry.example.com/fullchain.pem
    key: /etc/letsencrypt/live/registry.example.com/privkey.pem
```

### Using Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/registry`:

```nginx
server {
    listen 80;
    server_name registry.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name registry.example.com;

    ssl_certificate /etc/ssl/certs/registry.crt;
    ssl_certificate_key /etc/ssl/private/registry.key;

    client_max_body_size 0;
    chunked_transfer_encoding on;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/registry /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Authentication

### Using htpasswd

1. Create password file:
```bash
htpasswd -cB /etc/registry/htpasswd admin
```

2. Add to config:
```yaml
auth:
  htpasswd:
    realm: Registry
    path: /etc/registry/htpasswd
```

3. Login:
```bash
docker login registry.example.com
```

## Storage Backends

### Filesystem (Development)

```yaml
storage:
  filesystem:
    rootdirectory: /var/lib/registry
```

### Amazon S3

```yaml
storage:
  s3:
    accesskey: YOUR_ACCESS_KEY
    secretkey: YOUR_SECRET_KEY
    region: us-east-1
    bucket: my-registry-bucket
    encrypt: true
    secure: true
```

### Azure Blob Storage

```yaml
storage:
  azure:
    accountname: myaccount
    accountkey: YOUR_KEY
    container: registry
```

### Google Cloud Storage

```yaml
storage:
  gcs:
    bucket: my-registry-bucket
    keyfile: /path/to/keyfile.json
```

## Monitoring

### Health Check

```bash
curl http://localhost:5000/api/v1/health
```

### Metrics

Add to config:
```yaml
http:
  debug:
    addr: :5001
    prometheus:
      enabled: true
      path: /metrics
```

Access metrics:
```bash
curl http://localhost:5001/metrics
```

## Backup

### Filesystem Storage

```bash
# Backup
tar -czf registry-backup.tar.gz /var/lib/registry

# Restore
tar -xzf registry-backup.tar.gz -C /
```

### Cloud Storage

Backups are handled by the cloud provider (S3, Azure, GCS).

## Troubleshooting

### Check Logs

```bash
# Systemd
sudo journalctl -u registry -f

# Docker
docker logs -f registry-container

# Direct
./bin/registry serve config.yml
```

### Common Issues

**"Web UI not loading"**
- Check `webmanagement.enabled: true` in config
- Verify frontend was built: `ls -la registry/api/web/static/`
- Check browser console for errors

**"Cannot push images"**
- Verify storage backend is writable
- Check authentication configuration
- Ensure sufficient disk space

**"Permission denied"**
- Check file permissions on storage directory
- Verify registry user has correct permissions

## Scaling

### Multiple Replicas

For multiple registry instances:

1. Use shared storage (S3, Azure, GCS)
2. Use Redis for blob descriptor cache
3. Use shared auth backend
4. Load balance with Nginx or cloud LB

```yaml
storage:
  s3:
    bucket: shared-registry-bucket
  cache:
    blobdescriptor: redis

redis:
  addr: redis.example.com:6379
```

### Load Balancer

Nginx configuration:

```nginx
upstream registry {
    least_conn;
    server registry1:5000;
    server registry2:5000;
    server registry3:5000;
}

server {
    location / {
        proxy_pass http://registry;
    }
}
```

## Security Best Practices

1. **Use HTTPS** - Always use TLS in production
2. **Enable Authentication** - Use htpasswd or token auth
3. **Restrict Network Access** - Use firewall rules
4. **Keep Secrets Secure** - Use environment variables or secrets management
5. **Regular Updates** - Keep registry and dependencies updated
6. **Monitor Access** - Enable audit logging
7. **Backup Regularly** - Implement backup strategy

## Performance Tuning

### Redis Cache

```yaml
storage:
  cache:
    blobdescriptor: redis

redis:
  addr: localhost:6379
  pool:
    maxidle: 16
    maxactive: 64
    idletimeout: 300s
```

### HTTP Tuning

```yaml
http:
  http2:
    disabled: false
  headers:
    X-Content-Type-Options: [nosniff]
```

## Web Management Features

Access web UI at: `https://registry.example.com/`

Features:
- **Dashboard** - System status and metrics
- **Repositories** - Browse all repositories
- **Settings** - View configuration

To disable:
```yaml
webmanagement:
  enabled: false
```

## Support

- Documentation: `/docs/content/about/`
- Issues: GitHub Issues
- Logs: Check registry logs for errors

## Next Steps

1. Set up monitoring (Prometheus/Grafana)
2. Configure automated backups
3. Implement CI/CD integration
4. Set up notifications webhooks
5. Configure CDN for blob delivery
