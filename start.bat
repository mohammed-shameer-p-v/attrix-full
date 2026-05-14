@echo off
start cmd /k "cd /d C:\Users\hp\OneDrive\Desktop\attrix-full\backend && uvicorn app:app --reload"
start cmd /k "cd /d C:\Users\hp\OneDrive\Desktop\attrix-full && npm run dev"
start cmd /k "cd /d C:\Users\hp\OneDrive\Desktop\attrix-full\backend && docker build -t attrix-backend . && docker run -p 8000:8000 attrix-backend"
start chrome http://localhost:8080
