# CCEP Sustainability Analytics - Deployment Guide

## Overview

This guide covers deployment options for the CCEP Sustainability Analytics platform across different environments.

## Prerequisites

- Node.js 18+ and npm 8+
- OpenAI API key or Azure OpenAI access
- Database (SQLite for development, PostgreSQL/HANA for production)
- Container runtime (Docker) for containerized deployments

## Environment Configuration

### Development Environment

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd ccep-sustainability-capm
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp config/.env config/.env.local
   # Edit .env.local with your settings
   ```

3. **Initialize Database**
   ```bash
   npm run setup
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Production Environment

#### Option 1: Traditional Server Deployment

1. **Prepare Production Environment**
   ```bash
   # Install Node.js and npm
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd ccep-sustainability-capm
   
   # Install dependencies
   npm ci --production
   
   # Build application
   npm run build:prod
   
   # Configure environment
   cp config/.env config/.env.production
   # Edit .env.production with production settings
   ```

3. **Database Setup**
   ```bash
   # For PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   sudo -u postgres createdb ccep_sustainability
   
   # Deploy schema
   npm run deploy
   
   # Seed production data
   npm run seed:prod
   ```

4. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

#### Option 2: Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t ccep-sustainability:latest .
   ```

2. **Run with Docker Compose**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     app:
       image: ccep-sustainability:latest
       ports:
         - "4004:4004"
       environment:
         - NODE_ENV=production
         - OPENAI_API_KEY=${OPENAI_API_KEY}
         - DB_URL=postgresql://user:pass@db:5432/ccep_sustainability
       depends_on:
         - db
       volumes:
         - ./logs:/app/logs
     
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=ccep_sustainability
         - POSTGRES_USER=ccep_user
         - POSTGRES_PASSWORD=secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

#### Option 3: Kubernetes Deployment

1. **Create Kubernetes Manifests**
   ```yaml
   # k8s/deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: ccep-sustainability
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: ccep-sustainability
     template:
       metadata:
         labels:
           app: ccep-sustainability
       spec:
         containers:
         - name: app
           image: ccep-sustainability:latest
           ports:
           - containerPort: 4004
           env:
           - name: NODE_ENV
             value: "production"
           - name: OPENAI_API_KEY
             valueFrom:
               secretKeyRef:
                 name: api-secrets
                 key: openai-key
           resources:
             requests:
               memory: "512Mi"
               cpu: "250m"
             limits:
               memory: "1Gi"
               cpu: "500m"
   ```

2. **Deploy to Kubernetes**
   ```bash
   kubectl apply -f k8s/
   ```

## SAP BTP Deployment

### Cloud Foundry

1. **Prepare for CF Deployment**
   ```bash
   # Install CF CLI
   wget -q -O - https://packages.cloudfoundry.org/debian/cli.gpg | sudo apt-key add -
   echo "deb https://packages.cloudfoundry.org/debian stable main" | sudo tee /etc/apt/sources.list.d/cloudfoundry-cli.list
   sudo apt-get update
   sudo apt-get install cf-cli
   
   # Login to CF
   cf login -a <api-endpoint>
   ```

2. **Configure manifest.yml**
   ```yaml
   applications:
   - name: ccep-sustainability
     memory: 1G
     disk_quota: 2G
     instances: 2
     buildpacks:
       - nodejs_buildpack
     env:
       NODE_ENV: production
       OPENAI_API_KEY: ((openai-key))
     services:
       - ccep-hana-db
       - ccep-xsuaa
       - ccep-destination
   ```

3. **Deploy**
   ```bash
   cf push
   ```

### Kyma Runtime

1. **Create Helm Chart**
   ```yaml
   # helm/values.yaml
   replicaCount: 2
   
   image:
     repository: ccep-sustainability
     tag: latest
     pullPolicy: IfNotPresent
   
   service:
     type: ClusterIP
     port: 4004
   
   ingress:
     enabled: true
     annotations:
       kubernetes.io/ingress.class: nginx
     hosts:
       - host: ccep-sustainability.kyma.local
         paths: ["/"]
   
   env:
     NODE_ENV: production
     OPENAI_API_KEY: "from-secret"
   ```

2. **Deploy with Helm**
   ```bash
   helm install ccep-sustainability ./helm
   ```

## Database Configuration

### SQLite (Development)
```bash
# Automatic setup with npm run setup
DB_KIND=sqlite
DB_URL=db/sustainability.db
```

### PostgreSQL (Production)
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE ccep_sustainability;
CREATE USER ccep_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ccep_sustainability TO ccep_user;

# Environment configuration
DB_KIND=postgres
DB_URL=postgresql://ccep_user:secure_password@localhost:5432/ccep_sustainability
```

### SAP HANA (Enterprise)
```bash
# Environment configuration
DB_KIND=hana
DB_URL=hana://username:password@hostname:30015/database
```

## Security Configuration

### SSL/TLS Setup

1. **Generate SSL Certificates**
   ```bash
   # Self-signed for development
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   
   # Production: Use Let's Encrypt or corporate certificates
   ```

2. **Configure HTTPS**
   ```javascript
   // In server.js
   const https = require('https');
   const fs = require('fs');
   
   const options = {
     key: fs.readFileSync('key.pem'),
     cert: fs.readFileSync('cert.pem')
   };
   
   https.createServer(options, app).listen(443);
   ```

### Authentication Setup

1. **SAP BTP XSUAA**
   ```json
   {
     "xsappname": "ccep-sustainability",
     "tenant-mode": "shared",
     "scopes": [
       {
         "name": "sustainability.read",
         "description": "Read sustainability data"
       },
       {
         "name": "sustainability.write",
         "description": "Write sustainability data"
       }
     ],
     "role-templates": [
       {
         "name": "SustainabilityViewer",
         "scope-references": ["sustainability.read"]
       },
       {
         "name": "SustainabilityManager",
         "scope-references": ["sustainability.read", "sustainability.write"]
       }
     ]
   }
   ```

## Monitoring and Logging

### Application Monitoring

1. **Health Check Endpoint**
   ```bash
   curl http://localhost:4004/health
   ```

2. **Metrics Collection**
   ```bash
   # Install monitoring tools
   npm install prometheus-client
   npm install @sap/logging
   ```

3. **Log Aggregation**
   ```bash
   # Configure log forwarding
   # For ELK Stack
   filebeat -e -c filebeat.yml
   
   # For Splunk
   splunk add forward-server <splunk-server>:9997
   ```

### Performance Monitoring

1. **Application Performance**
   ```bash
   # Install clinic.js
   npm install -g clinic
   
   # Profile application
   npm run performance
   ```

2. **Database Monitoring**
   ```sql
   -- PostgreSQL monitoring queries
   SELECT * FROM pg_stat_activity;
   SELECT * FROM pg_stat_database;
   ```

## Backup and Recovery

### Database Backup

1. **PostgreSQL Backup**
   ```bash
   # Create backup
   pg_dump ccep_sustainability > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Restore backup
   psql ccep_sustainability < backup_20241015_103000.sql
   ```

2. **Automated Backup Script**
   ```bash
   #!/bin/bash
   # backup.sh
   BACKUP_DIR="/backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   # Database backup
   pg_dump ccep_sustainability > $BACKUP_DIR/db_$DATE.sql
   
   # Application files backup
   tar -czf $BACKUP_DIR/app_$DATE.tar.gz /app
   
   # Upload to cloud storage
   aws s3 cp $BACKUP_DIR/ s3://ccep-backups/ --recursive
   ```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 4004
   lsof -i :4004
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   systemctl status postgresql
   
   # Test connection
   psql -h localhost -U ccep_user -d ccep_sustainability
   ```

3. **OpenAI API Issues**
   ```bash
   # Test API key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

4. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   
   # Monitor memory usage
   node --inspect server.js
   ```

### Log Analysis

1. **Application Logs**
   ```bash
   # View logs
   tail -f logs/combined.log
   
   # Search for errors
   grep -i error logs/combined.log
   
   # Filter by timestamp
   grep "2024-10-15" logs/combined.log
   ```

2. **Performance Logs**
   ```bash
   # Analyze performance logs
   grep "Performance metric" logs/performance.log
   
   # Find slow queries
   grep "duration.*[5-9][0-9][0-9][0-9]" logs/combined.log
   ```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Configuration**
   ```nginx
   upstream ccep_sustainability {
       server 10.0.1.10:4004;
       server 10.0.1.11:4004;
       server 10.0.1.12:4004;
   }
   
   server {
       listen 80;
       location / {
           proxy_pass http://ccep_sustainability;
       }
   }
   ```

2. **Session Management**
   ```javascript
   // Use Redis for session storage
   const session = require('express-session');
   const RedisStore = require('connect-redis')(session);
   
   app.use(session({
       store: new RedisStore({ host: 'redis-server' }),
       secret: 'session-secret'
   }));
   ```

### Vertical Scaling

1. **Resource Optimization**
   ```bash
   # Increase container resources
   docker run -m 2g --cpus="1.5" ccep-sustainability
   
   # Kubernetes resource limits
   resources:
     limits:
       memory: "2Gi"
       cpu: "1500m"
   ```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly Tasks**
   - Review application logs
   - Check system performance metrics
   - Verify backup integrity
   - Update security patches

2. **Monthly Tasks**
   - Review and rotate API keys
   - Analyze usage patterns
   - Update dependencies
   - Performance optimization review

3. **Quarterly Tasks**
   - Security audit
   - Disaster recovery testing
   - Capacity planning review
   - Documentation updates

### Support Contacts

- **Technical Support**: sustainability-tech@ccep.com
- **Business Support**: sustainability-team@ccep.com
- **Emergency Contact**: +1-xxx-xxx-xxxx
