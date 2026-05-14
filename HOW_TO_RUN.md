# 🚀 Attrix — How to Run in VS Code

## 📁 Project Structure
```
attrix-full/
├── src/              ← Frontend React code
├── backend/          ← Python ML Backend
│   ├── app.py
│   ├── train_model.py
│   ├── requirements.txt
│   └── Dockerfile
├── package.json
└── .env
```

---

## ✅ STEP 1 — Open Project in VS Code
1. Extract the ZIP to your Desktop
2. Open VS Code
3. Click **File → Open Folder**
4. Select the `attrix-full` folder
5. Click **Open**

---

## ✅ STEP 2 — Run Frontend

Open terminal in VS Code → `Ctrl + `` (backtick)

```bash
npm install
npm run dev
```

Open browser → **http://localhost:5173** ✅

---

## ✅ STEP 3 — Run Backend (New Terminal)

Click the **+** button in terminal to open a NEW terminal

```bash
cd backend
pip install -r requirements.txt
python train_model.py
uvicorn app:app --reload
```

Backend runs at → **http://localhost:8000** ✅

Test it → open browser: **http://localhost:8000/health**
Should show: `{"status":"healthy","model_loaded":true}`

---

## ✅ STEP 4 — Connect Frontend to Backend

1. Open your website → **http://localhost:5173**
2. Login as Admin
3. Go to **Admin → Settings → API Keys**
4. In **Backend API URL** field, type:
   ```
   http://localhost:8000
   ```
5. Click **Save**

Now predictions use the real ML model! ✅

---

## ✅ STEP 5 — Run with Docker

Make sure Docker Desktop is running, then in terminal:

```bash
cd backend
docker build -t attrix-backend .
docker run -p 8000:8000 attrix-backend
```

Backend runs in Docker at → **http://localhost:8000** ✅

---

## ✅ STEP 6 — Setup Supabase (First Time Only)

1. Go to **supabase.com** → your project
2. Click **SQL Editor**
3. Copy everything from `supabase/migrations/` files
4. Paste and click **Run**
5. Go to **Authentication → Users → Add User**
6. Create admin user with your email
7. After creating, go to **Table Editor → user_roles**
8. Change that user's role to `admin`

---

## 🎯 For Presentation (10:00 AM)

Show these in order:
1. Open **http://localhost:5173** — show the website
2. Login as Admin
3. Go to **Predict** — fill form and show prediction
4. Go to **Admin Settings** — show API Keys section
5. Open terminal — show Docker running
6. Say: "ML model deployed via Docker, exposed via REST API at /predict"

---

## ⚡ Quick Commands Summary

| What | Command |
|------|---------|
| Start Frontend | `npm run dev` |
| Install Backend | `pip install -r requirements.txt` |
| Train Model | `python train_model.py` |
| Start Backend | `uvicorn app:app --reload` |
| Docker Build | `docker build -t attrix-backend .` |
| Docker Run | `docker run -p 8000:8000 attrix-backend` |
