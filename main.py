from pathlib import Path
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from app.chat.router import router as chat_router, admin_router
from app.rag.search import load_knowledge

app = FastAPI(title="Grobelnik AI", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.on_event("startup")
def startup():
    kb_path = Path(__file__).parent / "knowledge.jsonl"
    count = load_knowledge(kb_path)
    print(f"[startup] Grobelnik AI — {count} knowledge chunks loaded")

@app.get("/health")
def health():
    return {"status": "ok", "version": "v1"}

@app.get("/", response_class=HTMLResponse)
def home():
    widget_html = static_dir / "widget.html"
    if widget_html.exists():
        return widget_html.read_text(encoding="utf-8")
    return "<h1>Turistična kmetija Grobelnik AI</h1>"

app.include_router(chat_router)
app.include_router(admin_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
