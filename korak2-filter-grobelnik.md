# KORAK 2 — filter (guard) za Grobelnik AI

**Popravek prejšnjega navodila:** v `katalog-in-filter.md` je filter napisan v JavaScriptu. To je bilo napačno — Grobelnik AI je **FastAPI, Python 3**. Filter mora biti Python. Spodnja koda nadomesti razdelek KORAK 2 iz tistega dokumenta.

## Kaj sem videl v repoju

| Datoteka | Vloga |
|---|---|
| `main.py` | FastAPI app; ob zagonu kliče `load_knowledge(knowledge.jsonl)` |
| `app/chat/llm_chat.py` | `chat()` — sestavi system prompt + RAG kontekst, kliče OpenAI, vrne `{"reply": ...}` |
| `app/chat/router.py` | `/chat` endpoint, seje, zgodovina, povpraševanja |
| `app/rag/search.py` | BM25 iskanje po `knowledge.jsonl` |
| `katalog.json` | **zaenkrat ga ne naloži nihče** |

**Točka vklopa:** `app/chat/llm_chat.py`, zadnje vrstice funkcije `chat()`:

```python
    reply = (response.choices[0].message.content or "").strip()
    if not reply:
        reply = "Oprostite, nisem razumel vprašanja. Pokličite nas: 041 335 257"
    return {"reply": reply}       # <-- filter gre sem, tik pred return
```

To je edino mesto, skozi katero gre vsak odgovor. `router.py` ne diraj.

---

## 1. Nova datoteka `app/chat/katalog.py`

Naloži katalog enkrat ob zagonu in izlušči dovoljene številke.

```python
"""Nalaganje katalog.json in izluščenje dovoljenih številskih vrednosti."""
from __future__ import annotations

import json
import re
from pathlib import Path

_KATALOG_PATH = Path(__file__).resolve().parents[2] / "katalog.json"

_KATALOG: dict = {}
_DOVOLJENE: set[str] = set()

# Iz katerih polj se sme brati številke. Nikoli iz `todo`, `koordinate`,
# `preverjeno`, `vir`, `leto` — tam so nepotrjene cene, GPS in datumi.
_POLJA = ("cena", "kolicina", "naziv", "vkljuceno", "pogoji", "odgovor")

_STEVILKA = re.compile(r"\d+(?:[.,]\d+)?")


def _normaliziraj(s: str) -> str:
    s = s.replace(",", ".")
    if s.endswith(".00"):
        s = s[:-3]
    if s.endswith(".0"):
        s = s[:-2]
    return s


def nalozi(path: str | Path | None = None) -> int:
    global _KATALOG, _DOVOLJENE
    p = Path(path) if path else _KATALOG_PATH
    if not p.exists():
        print(f"[katalog] NI NAJDEN: {p}")
        return 0

    _KATALOG = json.loads(p.read_text(encoding="utf-8"))
    _DOVOLJENE = set()

    for postavka in _KATALOG.get("postavke", []):
        for polje in _POLJA:
            vrednost = postavka.get(polje)
            if vrednost is None:
                continue
            if isinstance(vrednost, (int, float)):
                _DOVOLJENE.add(_normaliziraj(str(vrednost)))
                continue
            besedilo = " ".join(vrednost) if isinstance(vrednost, list) else str(vrednost)
            for m in _STEVILKA.finditer(besedilo):
                _DOVOLJENE.add(_normaliziraj(m.group(0)))

    print(f"[katalog] {len(_KATALOG.get('postavke', []))} postavk, "
          f"{len(_DOVOLJENE)} dovoljenih vrednosti")
    return len(_KATALOG.get("postavke", []))


def dovoljene() -> set[str]:
    return _DOVOLJENE


def preusmeritev() -> str:
    return _KATALOG.get(
        "preusmeritev",
        "Tega podatka nimam. Pokličite 041 335 257 ali pišite na info@grobelnik.si.",
    )
```

## 2. Nova datoteka `app/chat/guard.py`

```python
"""Filter nad odgovorom modela: številka brez podlage v katalogu ne gre ven."""
from __future__ import annotations

import os
import re

from app.chat import katalog

# Številka z enoto, ki je bot ne sme izreči brez podlage v katalogu.
_VZORCI = [
    ("cena",     re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:EUR|€|evrov|eur)", re.I)),
    ("razdalja", re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:km|kilometr\w*)", re.I)),
    ("cas",      re.compile(r"(\d+)\s*(?:min\b|minut\w*|ur[aei]?\b)", re.I)),
    ("odstotek", re.compile(r"(\d+(?:[.,]\d+)?)\s*%")),
]

# Besede, ki jih bot pri navigaciji ne sme uporabiti.
_PREPOVEDANE = [
    re.compile(r"\bavtocest\w*", re.I),
    re.compile(r"\bA1\b"),
    re.compile(r"\bA2\b"),
    re.compile(r"\bizvoz\w*", re.I),
    re.compile(r"\bsmerokaz\w*", re.I),
    re.compile(r"\bkrožišč\w*", re.I),
]


def _blokiraj_vklopljen() -> bool:
    return os.getenv("GUARD_BLOKIRAJ", "0") == "1"


def preveri(odgovor: str) -> tuple[str, list[str]]:
    """Vrne (odgovor, najdbe). Ob praznih najdbah je odgovor nespremenjen."""
    najdbe: list[str] = []
    dovoljene = katalog.dovoljene()

    for ime, vzorec in _VZORCI:
        for m in vzorec.finditer(odgovor):
            st = m.group(1).replace(",", ".")
            if st.endswith(".00"):
                st = st[:-3]
            if st.endswith(".0"):
                st = st[:-2]
            if st not in dovoljene:
                najdbe.append(f"{ime}:{m.group(0).strip()}")

    for vzorec in _PREPOVEDANE:
        m = vzorec.search(odgovor)
        if m:
            najdbe.append(f"navigacija:{m.group(0)}")

    if not najdbe:
        return odgovor, []

    print(f"[GUARD] nepodprto: {', '.join(najdbe)} | odgovor: {odgovor[:200]}")

    if _blokiraj_vklopljen():
        return katalog.preusmeritev(), najdbe
    return odgovor, najdbe
```

## 3. Vklop v `main.py`

Ob zagonu naloži tudi katalog:

```python
from app.chat import katalog          # dodaj k obstoječim uvozom

@app.on_event("startup")
def startup():
    kb_path = Path(__file__).parent / "knowledge.jsonl"
    count = load_knowledge(kb_path)
    kat = katalog.nalozi()                                    # <-- novo
    print(f"[startup] Grobelnik AI — {count} knowledge chunks, {kat} katalog postavk")
```

## 4. Vklop v `app/chat/llm_chat.py`

```python
from app.chat.guard import preveri    # dodaj k obstoječim uvozom

# ... na koncu funkcije chat():
    reply = (response.choices[0].message.content or "").strip()
    if not reply:
        reply = "Oprostite, nisem razumel vprašanja. Pokličite nas: 041 335 257"

    reply, najdbe = preveri(reply)                            # <-- novo
    return {"reply": reply}
```

Ne spreminjaj podpisa funkcije `chat()` in ne dodajaj polj v vrnjeni slovar — `router.py` bere samo `result["reply"]`.

## 5. Dve fazi — pomembno

**Faza A: `GUARD_BLOKIRAJ=0`** (privzeto, ni treba nastavljati). Filter samo piše v log, odgovora ne spremeni. Pusti teči teden dni in beri log v Railwayu.

**Faza B: `GUARD_BLOKIRAJ=1`.** V Railwayu dodaj spremenljivko okolja. Vklopi šele, ko so logi čisti.

Vsak zadetek v logu pomeni eno od dvojega: bot si je izmislil, ali pa v katalogu manjka zapis. Oboje popravi, preden vklopiš fazo B.

---

## TEST PO POPRAVKU

Lokalno (`uvicorn main:app`), nato v produkciji. Ob zagonu mora izpisati število postavk kataloga.

| # | Vhod | Pričakovano v logu |
|---|---|---|
| 1 | kolko stane soba za dva | **nič** — 85 je v katalogu |
| 2 | kako dalec ste od Sevnice | `[GUARD] nepodprto: razdalja:…` ali odgovor brez km |
| 3 | kako pridem do vas z avtom iz Ljubljane | `[GUARD] nepodprto: navigacija:…` |
| 4 | kolko je turisticna taksa | **nič** — odgovor je „Tega podatka nimam" |
| 5 | koliko stane silvestrovanje | **nič** — 185 je v katalogu (a glej opombo spodaj) |
| 6 | katera vina imate | **nič** |
| 7 | ob kateri uri je prijava | **nič** |

Če se filter oglasi pri 1, 4, 6 ali 7, je v katalogu luknja — dodaj zapis, ne izklapljaj filtra.

**Opomba k testu 5:** filter spusti 185 skozi, ker je cena resnična. Da je bot ne bo navajal kot **aktualno**, potrebuje pravilo v system promptu — to je KORAK 3.

---

## Dve stvari, ki sem ju opazil mimogrede

**1. Privzeto administratorsko geslo je v kodi.**

```python
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "<privzeto geslo — redigirano>")
```

`app/chat/router.py`, vrstica 21. Če spremenljivka `ADMIN_PASSWORD` v Railwayu ni nastavljena, velja to geslo — in z njim je dosegljiv `/api/admin/conversations`, ki vrne **vse pogovore vseh gostov**. Ti lahko vsebujejo osebne podatke.

Preveri dvoje: ali je spremenljivka v Railwayu nastavljena, in ali je repo na GitHubu javen. Če je javen, je geslo objavljeno. Pravi popravek je, da privzete vrednosti ni:

```python
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

def _check_admin(key: str) -> None:
    if not ADMIN_PASSWORD or key != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
```

Brez nastavljene spremenljivke potem admin endpointi ne delajo za nikogar — kar je pravilno.

**2. `app/rag/search.py` se predstavlja kot Kovačnikov.** Prva vrstica docstringa: *„Simplified RAG search for Kovačnik V2."* Isto poreklo kot ključi `mh_widget_*` v `widget.js` (Marles Hiše). Kozmetika, a ob priložnosti popravi oboje — sicer se pri naslednjem botu ne bo dalo ugotoviti, kaj je od kod.
