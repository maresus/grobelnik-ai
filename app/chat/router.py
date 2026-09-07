from __future__ import annotations
import os, smtplib, uuid
from datetime import datetime, timezone, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import HTMLResponse
from pathlib import Path
from pydantic import BaseModel
from app.chat.llm_chat import chat

router = APIRouter(prefix="/chat", tags=["chat"])
admin_router = APIRouter(tags=["admin"])

_sessions: dict[str, dict] = {}
_conversations: list[dict] = []
_inquiries: list[dict] = []
_MAX_STORED = 5000

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

BRAND = "#5C7A35"
BRAND_DARK = "#4A6228"


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str

class InquiryRequest(BaseModel):
    ime: str
    telefon: str
    email: str | None = None
    sporocilo: str | None = None
    tip: str | None = None


def _send_email(to: str, subject: str, html: str) -> bool:
    if not SMTP_HOST or not SMTP_USER or not to:
        print(f"[email] SMTP ni konfiguriran — preskočeno")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to
        msg.attach(MIMEText(html, "html", "utf-8"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(FROM_EMAIL, to, msg.as_string())
        return True
    except Exception as e:
        print(f"[email] Napaka: {e}")
        return False


def _check_admin(key: str) -> None:
    if not ADMIN_PASSWORD or key != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _get_session(session_id: str | None) -> tuple[str, dict]:
    if session_id and session_id in _sessions:
        return session_id, _sessions[session_id]
    new_id = session_id or str(uuid.uuid4())
    _sessions[new_id] = {"history": [], "started": datetime.now(timezone.utc).isoformat()}
    return new_id, _sessions[new_id]


def _log_conversation(session_id: str, user_msg: str, bot_reply: str) -> None:
    global _conversations
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    _conversations.append({"session_id": session_id, "user_message": user_msg, "bot_response": bot_reply, "created_at": ts})
    if len(_conversations) > _MAX_STORED:
        _conversations = _conversations[-_MAX_STORED:]


@router.post("", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    session_id, session = _get_session(payload.session_id)
    message = payload.message.strip()
    result = chat(message=message, history=session["history"])
    session["history"].append({"role": "user", "content": message})
    session["history"].append({"role": "assistant", "content": result["reply"]})
    if len(session["history"]) > 20:
        session["history"] = session["history"][-20:]
    _log_conversation(session_id, message, result["reply"])
    return ChatResponse(reply=result["reply"], session_id=session_id)


@router.post("/inquiry")
async def submit_inquiry(payload: InquiryRequest):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    inq_id = str(uuid.uuid4())[:8]
    _inquiries.append({
        "id": inq_id,
        "ime": payload.ime,
        "telefon": payload.telefon,
        "email": payload.email,
        "tip": payload.tip or "-",
        "sporocilo": payload.sporocilo or "-",
        "status": "caka",
        "admin_notes": "",
        "created_at": ts
    })

    admin_html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:{BRAND};padding:24px;border-radius:8px 8px 0 0;">
      <h2 style="color:#fff;margin:0;">Novo povpraševanje — Kmetija Grobelnik</h2>
      <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;">{ts} UTC</p>
    </div>
    <div style="background:#f8f9fa;padding:24px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;width:140px;"><b>Ime</b></td><td>{payload.ime}</td></tr>
        <tr><td style="padding:8px 0;color:#666;"><b>Telefon</b></td><td><a href="tel:{payload.telefon}" style="color:{BRAND};">{payload.telefon}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;"><b>Email</b></td><td>{f'<a href="mailto:{payload.email}" style="color:{BRAND};">{payload.email}</a>' if payload.email else "-"}</td></tr>
        <tr><td style="padding:8px 0;color:#666;"><b>Storitev</b></td><td>{payload.tip or "-"}</td></tr>
        <tr><td style="padding:8px 0;color:#666;vertical-align:top;"><b>Sporočilo</b></td><td>{payload.sporocilo or "-"}</td></tr>
      </table>
    </div>
    </body></html>"""
    _send_email(ADMIN_EMAIL, f"Povpraševanje Grobelnik: {payload.ime}", admin_html)

    confirm_html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:{BRAND};padding:24px;border-radius:8px 8px 0 0;">
      <h2 style="color:#fff;margin:0;">Hvala za povpraševanje, {payload.ime}!</h2>
      <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;">Turistična kmetija Grobelnik</p>
    </div>
    <div style="background:#f8f9fa;padding:24px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">
      <p>Prejeli smo vaše povpraševanje. Odgovorili vam bomo v najkrajšem možnem času.</p>
      <div style="background:{BRAND};color:#fff;padding:16px;border-radius:8px;margin:20px 0;">
        <b>Naši kontakti:</b><br>
        Tel: 041 335 257<br>
        Email: info@grobelnik.si<br>
        Splet: grobelnik.si
      </div>
      <p style="color:#999;font-size:12px;">Turistična kmetija Grobelnik · Podvrh 39, 8292 Zabukovje nad Sevnico</p>
    </div>
    </body></html>"""
    if payload.email:
        _send_email(payload.email, "Potrditev povpraševanja — Kmetija Grobelnik", confirm_html)
    return {"ok": True, "id": inq_id}


@admin_router.get("/api/admin/inquiries")
def get_inquiries(key: str = Query(default=""), status: str = Query(default=""), hours: int = Query(default=0)):
    _check_admin(key)
    result = list(_inquiries)
    if hours > 0:
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
        result = [i for i in result if i.get("created_at", "") >= cutoff]
    if status:
        result = [i for i in result if i.get("status") == status]
    return {"inquiries": list(reversed(result)), "total": len(result)}


@admin_router.patch("/api/admin/inquiries/{inq_id}")
def update_inquiry(inq_id: str, payload: dict, key: str = Query(default="")):
    _check_admin(key)
    for inq in _inquiries:
        if inq.get("id") == inq_id:
            if "status" in payload:
                inq["status"] = payload["status"]
            if "admin_notes" in payload:
                inq["admin_notes"] = payload["admin_notes"]
            inq["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
            return {"ok": True, "inquiry": inq}
    raise HTTPException(status_code=404, detail="Povpraševanje ni najdeno")


@admin_router.get("/api/admin/stats")
def get_stats(key: str = Query(default="")):
    _check_admin(key)
    now = datetime.now(timezone.utc)
    def ts_filter(hours):
        cutoff = (now - timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
        return [i for i in _inquiries if i.get("created_at", "") >= cutoff]
    statusi = {"caka": 0, "potrjeno": 0, "zavrnjeno": 0}
    for i in _inquiries:
        s = i.get("status", "caka")
        statusi[s] = statusi.get(s, 0) + 1
    return {
        "danes": len(ts_filter(24)),
        "teden": len(ts_filter(168)),
        "skupaj": len(_inquiries),
        "statusi": statusi,
    }


@admin_router.get("/api/admin/conversations")
def get_conversations(key: str = Query(default=""), hours: int = Query(default=24)):
    _check_admin(key)
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
    filtered = [c for c in _conversations if c.get("created_at", "") >= cutoff]
    return {"conversations": list(reversed(filtered)), "total": len(filtered)}
