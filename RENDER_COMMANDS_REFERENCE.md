# 🚀 Render Deployment Commands - Quick Reference

## ✅ Correct Commands for Your Fit Hub Portal

### Backend Service Configuration

| Setting | Value |
|---------|-------|
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn --chdir server app:app` |

### Frontend Service Configuration

| Setting | Value |
|---------|-------|
| **Runtime** | `Static Site` |
| **Build Command** | `cd client && npm install --legacy-peer-deps && npm run build` |
| **Publish Directory** | `client/build` |

---

## 📝 Gunicorn Command Explained

### The Correct Command:
```bash
gunicorn --chdir server app:app
```

**What it does:**
- `gunicorn` - Production WSGI server
- `--chdir server` - Change directory to `server/` folder
- `app:app` - Import `app` from `app.py` file

### Why This Works:
```
Project Root
├── server/
│   ├── app.py          ← Contains Flask app
│   ├── auth.py
│   └── ... other files
└── requirements.txt

Command runs from project root
↓
Changes to server/ directory
↓
Imports app from app.py
↓
Runs Flask application
```

---

## ⚙️ Alternative Commands (If Needed)

### Option 1: Using --chdir (Recommended)
```bash
gunicorn --chdir server app:app
```
✅ **Use this one** - Clean and works everywhere

### Option 2: Using bind and workers
```bash
gunicorn --chdir server --bind 0.0.0.0:$PORT --workers 2 app:app
```
✅ Good for custom configuration

### Option 3: With configuration file
```bash
gunicorn --chdir server --config gunicorn_config.py app:app
```
✅ Advanced usage

---

## 🔧 Gunicorn Configuration Options

### Common Options:

| Option | Description | Example |
|--------|-------------|---------|
| `--workers` | Number of worker processes | `--workers 4` |
| `--bind` | Server socket to bind | `--bind 0.0.0.0:8000` |
| `--timeout` | Workers timeout | `--timeout 120` |
| `--log-level` | Logging level | `--log-level info` |
| `--access-logfile` | Access log file | `--access-logfile -` (stdout) |
| `--error-logfile` | Error log file | `--error-logfile -` (stderr) |

### For Render (Recommended):
```bash
gunicorn --chdir server --workers 2 --timeout 120 --log-level info app:app
```

**Note:** Render automatically sets `$PORT` environment variable

---

## 🐛 Troubleshooting Commands

### Test Locally Before Deploying:

#### On Windows (PowerShell):
```powershell
# Install gunicorn locally
pip install gunicorn

# Test the command (won't work on Windows, but validates syntax)
gunicorn --chdir server app:app

# Better: Use Flask dev server locally
cd server
python app.py
```

#### On Linux/Mac:
```bash
# Install gunicorn
pip install gunicorn

# Test locally
gunicorn --chdir server --bind 127.0.0.1:5000 app:app

# Access at: http://localhost:5000
```

---

## 📊 Render Environment Variables

Render automatically provides:

| Variable | Description | Auto-set |
|----------|-------------|----------|
| `PORT` | Port to bind to | ✅ Yes |
| `RENDER` | Set to `true` | ✅ Yes |
| `RENDER_SERVICE_NAME` | Your service name | ✅ Yes |
| `RENDER_GIT_COMMIT` | Current commit SHA | ✅ Yes |

You need to set:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection | ✅ Yes |
| `JWT_SECRET` | JWT secret key | ✅ Yes |
| `SECRET_KEY` | Flask secret | ✅ Yes |
| `FLASK_ENV` | Environment | ✅ Yes |
| `RAPIDAPI_KEY` | RapidAPI key | ⚠️ Optional |

---

## 🔍 Common Issues & Fixes

### Issue: "Failed to find application object 'app'"

**Wrong:**
```bash
gunicorn server.app:app  # Looks for package structure
cd server && gunicorn app:app  # Doesn't work on Render
```

**Correct:**
```bash
gunicorn --chdir server app:app  # ✅ Works!
```

### Issue: "Address already in use"

**Solution:** Render manages ports automatically
```bash
# Don't specify port - Render handles it
gunicorn --chdir server app:app

# NOT: gunicorn --bind 0.0.0.0:5000 ...
```

### Issue: "Worker timeout"

**Solution:** Increase timeout
```bash
gunicorn --chdir server --timeout 120 app:app
```

---

## 📦 Build Command Details

### Backend Build:
```bash
pip install -r requirements.txt
```

**What it installs:**
- Flask==3.1.0
- Flask-CORS==5.0.0
- Flask-JWT-Extended==4.7.1
- gunicorn==23.0.0
- pymongo==4.10.1
- ... and all other dependencies

### Frontend Build:
```bash
cd client && npm install --legacy-peer-deps && npm run build
```

**What it does:**
1. Changes to `client/` directory
2. Installs npm packages (uses legacy peer deps for compatibility)
3. Runs build script (creates optimized production build)
4. Outputs to `client/build/` directory

---

## 🎯 Complete Render Setup Commands

### Via Render Dashboard (Recommended):

**Backend:**
```
Build Command: pip install -r requirements.txt
Start Command: gunicorn --chdir server app:app
```

**Frontend:**
```
Build Command: cd client && npm install --legacy-peer-deps && npm run build
Publish Directory: client/build
```

### Via render.yaml (Auto-deploy):

Already configured in your `render.yaml` file:

```yaml
services:
  # Backend
  - type: web
    name: fithub-api
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn --chdir server app:app
    
  # Frontend
  - type: web
    name: fithub-frontend
    buildCommand: cd client && npm install --legacy-peer-deps && npm run build
    staticPublishPath: client/build
```

---

## 🚀 Deployment Workflow

### Initial Deploy:
```bash
# 1. Commit all changes
git add .
git commit -m "Ready for Render deployment"

# 2. Push to GitHub
git push origin master

# 3. Render auto-deploys (if connected)
# OR manually create services with above commands
```

### Update Deploy:
```bash
# 1. Make changes
# Edit files...

# 2. Commit and push
git add .
git commit -m "Update feature"
git push origin master

# 3. Render auto-redeploys
# Watch progress in Render dashboard
```

---

## 📝 Testing Commands

### Test Backend Locally:
```bash
# Development server
cd server
python app.py

# Production server (with gunicorn)
gunicorn --chdir server --bind 127.0.0.1:5000 app:app
```

### Test Frontend Locally:
```bash
# Development server
cd client
npm start

# Production build test
cd client
npm run build
# Then serve the build folder
npx serve -s build
```

---

## 🔐 Security Commands

### Generate Secrets Locally:
```bash
# Python
python -c "import secrets; print(secrets.token_hex(32))"

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

### Test MongoDB Connection:
```bash
python -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URI'); print(client.server_info()['version'])"
```

---

## 📊 Health Check Commands

### Check Backend:
```bash
# Local
curl http://localhost:5000/

# Production
curl https://your-backend.onrender.com/
```

### Check Frontend:
```bash
# Production
curl https://your-frontend.onrender.com/
```

---

## 🎉 Quick Command Summary

**Copy-paste these into Render:**

### Backend Service:
```
Build Command:
pip install -r requirements.txt

Start Command:
gunicorn --chdir server app:app
```

### Frontend Service:
```
Build Command:
cd client && npm install --legacy-peer-deps && npm run build

Publish Directory:
client/build
```

---

**✅ These are the EXACT commands that will work for your Fit Hub Portal!**

No modifications needed - just copy and paste into Render dashboard.

---

*Pro Tip: Render shows real-time logs. Watch them during deployment to see these commands execute!*
