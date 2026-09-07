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
