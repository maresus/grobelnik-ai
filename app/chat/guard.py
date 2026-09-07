"""Filter nad odgovorom modela: številka brez podlage v katalogu ne gre ven."""
from __future__ import annotations

import os
import re

from app.chat import katalog

# Številka z enoto, ki je bot ne sme izreči brez podlage v katalogu.
_VZORCI = [
    ("cena",     re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:EUR|€|evrov|eur)", re.I)),
    ("razdalja", re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:km|kilometr\w*)", re.I)),
    ("cas",      re.compile(r"(\d+)\.?\s*(?:min\b|minut\w*|ur[aei]?\b)", re.I)),
    ("ura",      re.compile(r"\b(\d{1,2})(?:[:.](\d{2})\b|\s*h\b)")),
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
