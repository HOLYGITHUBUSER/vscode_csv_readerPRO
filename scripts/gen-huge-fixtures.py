#!/usr/bin/env python3
"""
Generate huge CSV fixtures for *manual stress testing* (test-示例/).

WARNING
-------
This OVERWRITES `test-示例/super_example.csv` (1109-row normal sample used for
tryout) with a 50,000-row × 60-column monster. Opening that monster in VS Code
is very slow and has been observed to trigger internal `Assertion Failed:
Argument is `undefined` or `null`` inside VS Code core on some versions.

Run this only when you explicitly want to pressure-test chunked rendering /
memory behaviour, and restore the small fixtures afterwards:

    cp src-源码/test/super_example.csv test-示例/super_example.csv
    cp src-源码/test/complex_test.csv   test-示例/complex_test.csv

Outputs (overwritten):
  - test-示例/super_example.csv   (50,000 data rows, 60 columns + 3 meta rows + header)
  - test-示例/complex_test.csv    (~2,000 rows, 60 columns; preserves the original
                                  hand-crafted rows at the top)
"""

from __future__ import annotations

import base64
import csv
import hashlib
import json
import random
import string
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXAMPLE_DIR = ROOT / "test-示例"

SUPER_PATH = EXAMPLE_DIR / "super_example.csv"
COMPLEX_PATH = EXAMPLE_DIR / "complex_test.csv"

SUPER_ROWS = 50_000
COMPLEX_ROWS = 2_000
TOTAL_COLS = 60


def _rand_choice(rng: random.Random, xs: list[str]) -> str:
    return xs[rng.randrange(len(xs))]


def _rand_token(rng: random.Random, n: int) -> str:
    return "".join(rng.choice(string.ascii_letters + string.digits) for _ in range(n))


def _iso_date(base: datetime, i: int) -> str:
    d = base + timedelta(days=i % 3650)
    return d.strftime("%Y-%m-%d")


def _iso_dt(base: datetime, i: int) -> str:
    dt = base + timedelta(minutes=i * 13)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _maybe_empty(rng: random.Random, s: str, p: float = 0.03) -> str:
    return "" if rng.random() < p else s


def _build_super_header() -> list[str]:
    # Preserve the original 12 columns exactly for type inference / familiarity.
    base12 = [
        "Hero",
        "Sidekick",
        "CanFly",
        "HasCape",
        "FirstSeen",
        "LastSeen",
        "Rescues",
        "Disasters",
        "Power",
        "Speed",
        "Note",
        "Spare",
    ]

    extra = [
        "UUID",
        "Email",
        "URL",
        "IPv4",
        "IPv6",
        "GeoLat",
        "GeoLng",
        "Country",
        "City",
        "PhoneE164",
        "Currency",
        "Price",
        "Percent",
        "Rating",
        "Bytes",
        "Version",
        "ColorHex",
        "RGB",
        "JSON",
        "Tags",
        "EnumStatus",
        "SHA256",
        "Base64",
        "Markdown",
        "HTML",
        "Emoji",
        "RTL",
        "LongText",
        "Formula",
        "BoolVariant",
        "NullLike",
        "NaNLike",
        "IntBig",
        "IntNeg",
        "FloatSci",
        "DateAlt",
        "DateTime",
        "PathWin",
        "PathUnix",
        "MimeType",
        "UserAgent",
        "MAC",
        "ID64",
        "KeyValue",
        "CSVFragment",
        "TSVFragment",
        "QuoteStress",
        "NewlineStress",
    ]

    header = base12 + extra
    if len(header) != TOTAL_COLS:
        raise RuntimeError(f"header columns = {len(header)}, expected {TOTAL_COLS}")
    return header


def _super_row(rng: random.Random, i: int, base: datetime) -> list[str]:
    animals = [
        "Tiger",
        "Jaguar",
        "Falcon",
        "Eagle",
        "Viper",
        "Cobra",
        "Panther",
        "Cheetah",
        "Lynx",
        "Orca",
        "Manta",
        "Komodo",
        "Okapi",
        "Ibex",
        "Ocelot",
        "Condor",
        "Puma",
        "Kudu",
        "Narwhal",
        "Gazelle",
        "Kestrel",
        "Caracal",
        "Serval",
        "Hyena",
        "Jackal",
        "Civet",
        "Tapir",
        "Marmot",
        "Otter",
        "Heron",
    ]
    codes = [
        "Nova",
        "Blaze",
        "Zephyr",
        "Titan",
        "Aster",
        "Vortex",
        "Quasar",
        "Rift",
        "Halo",
        "Echo",
        "Prism",
        "Surge",
        "Ember",
        "Fang",
        "Talon",
        "Bolt",
        "Drift",
        "Flux",
        "Nimbus",
        "Raptor",
    ]

    animal = animals[i % len(animals)]
    code = codes[i % len(codes)]
    side = codes[(i * 3) % len(codes)]

    # Original 12 columns (keep Note/Spare empty).
    hero = f"{code} {animal}"
    sidekick = _maybe_empty(rng, f"Kid {side}", p=0.02)
    can_fly = "true" if (i % 2 == 0) else "false"
    has_cape = "TRUE" if (i % 3 == 0) else "FALSE"
    first_seen = _iso_date(base, i)
    last_seen = _iso_date(datetime(2024, 1, 1), i * 7)
    rescues = _maybe_empty(rng, str((i * 13) % 1000), p=0.02)
    disasters = str(500 + i * 2)
    power = f"{i % 100}.{i % 100:02d}"
    speed = f"{60 + ((i * 13) % 40)}.{(i * 11) % 100:02d}"
    note = ""
    spare = ""

    # Extra 48 columns.
    uid = str(uuid.UUID(int=(i * 7919) % (1 << 128)))
    email = f"user{i}@example.com"
    url = f"https://example.com/u/{i}?q={_rand_token(rng, 6)}"
    ipv4 = f"{(i*7)%256}.{(i*11)%256}.{(i*13)%256}.{(i*17)%256}"
    ipv6 = f"2001:db8:{i%65535:04x}:{(i*7)%65535:04x}::{(i*13)%65535:04x}"
    lat = f"{(rng.random()*180-90):.6f}"
    lng = f"{(rng.random()*360-180):.6f}"
    country = _rand_choice(rng, ["US", "CN", "DE", "JP", "BR", "IN", "FR", "GB", "CA", "AU"])
    city = _rand_choice(rng, ["Berlin", "Tokyo", "Shanghai", "Mumbai", "São Paulo", "Paris", "London", "Sydney"])
    phone = f"+{(i%80)+10}{(1000000000 + (i*97)%9000000000)}"
    currency = _rand_choice(rng, ["USD", "EUR", "JPY", "CNY", "GBP", "INR", "BRL"])
    price = f"{(i%5000) + rng.random():.2f}"
    percent = f"{(i%101)}%"
    rating = f"{(rng.random()*5):.2f}"
    bytes_s = str((i * 1048576) % (50 * 1024 * 1024 * 1024))
    version = f"{i%5}.{(i*7)%20}.{(i*11)%200}"
    color_hex = f"#{(i*2654435761) & 0xFFFFFF:06x}"
    rgb = f"{(i*3)%256},{(i*5)%256},{(i*7)%256}"
    payload = {"id": i, "hero": hero, "ok": (i % 4 == 0), "score": float(power)}
    json_s = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    tags = "|".join({_rand_choice(rng, ["alpha", "beta", "prod", "dev", "staging", "hotfix", "edge"]) for _ in range(3)})
    enum_status = _rand_choice(rng, ["NEW", "OPEN", "DONE", "CLOSED", "BLOCKED", "PAUSED"])
    sha = hashlib.sha256(f"{hero}:{i}".encode("utf-8")).hexdigest()
    b64 = base64.b64encode(f"{i}:{hero}".encode("utf-8")).decode("ascii")
    md = f"**{hero}** - _speed_ `{speed}`"
    html = f"<b>{hero}</b><span data-i=\"{i}\">{city}</span>"
    emoji = _rand_choice(rng, ["🚀", "🎉", "🧪", "📦", "⚡", "🔒", "🧭", "🧬"])
    rtl = _rand_choice(rng, ["مرحبا", "שלום", "العربية", "עברית"])
    long_text = ("Lorem ipsum dolor sit amet, " * (3 + (i % 5))).strip()
    formula = _rand_choice(rng, [f"=SUM(A{i}:B{i})", f"@HYPERLINK(\"http://x{i}.tld\")", f"+CMD|'/C calc'!A0"])
    bool_variant = _rand_choice(rng, ["TRUE", "FALSE", "true", "false", "1", "0", "Yes", "No"])
    null_like = _rand_choice(rng, ["NULL", "null", "None", "N/A", ""])
    nan_like = _rand_choice(rng, ["NaN", "nan", ""])
    int_big = str(10**12 + i * 99991)
    int_neg = str(-((i * 37) % 100000))
    float_sci = f"{(rng.random()*9+1):.4e}"
    date_alt = (base + timedelta(days=i)).strftime("%d/%m/%Y")
    dt = _iso_dt(base.replace(tzinfo=timezone.utc), i)
    path_win = rf"C:\Users\user{i}\Documents\file_{i}.csv"
    path_unix = f"/home/user{i}/data/file_{i}.csv"
    mime = _rand_choice(rng, ["text/csv", "application/json", "text/plain", "application/octet-stream"])
    ua = _rand_choice(rng, ["curl/8.0", "Mozilla/5.0", "PostmanRuntime/7.36.0", "vscode/1.90"])
    mac = f"{(i*7)%256:02x}:{(i*11)%256:02x}:{(i*13)%256:02x}:{(i*17)%256:02x}:{(i*19)%256:02x}:{(i*23)%256:02x}"
    id64 = base64.b32encode(f"id-{i}".encode("utf-8")).decode("ascii").rstrip("=")
    kv = f"k{i%17}=v{(i*31)%997}"
    csv_frag = 'a,"b,b",c'
    tsv_frag = "a\tb\tc"
    # csv.writer (QUOTE_MINIMAL) escapes inner `"` automatically, so write
    # them as single quotes in the source string; VS Code / Papa.parse will see
    # them as `""` after csv.writer serialises the field.
    quote_stress = 'He said "Hello, CSV!" then left'
    newline_stress = "line1\nline2\nline3"

    row = [
        hero,
        sidekick,
        can_fly,
        has_cape,
        first_seen,
        last_seen,
        rescues,
        disasters,
        power,
        speed,
        note,
        spare,
        uid,
        email,
        url,
        ipv4,
        ipv6,
        lat,
        lng,
        country,
        city,
        phone,
        currency,
        price,
        percent,
        rating,
        bytes_s,
        version,
        color_hex,
        rgb,
        json_s,
        tags,
        enum_status,
        sha,
        b64,
        md,
        html,
        emoji,
        rtl,
        long_text,
        formula,
        bool_variant,
        null_like,
        nan_like,
        int_big,
        int_neg,
        float_sci,
        date_alt,
        dt,
        path_win,
        path_unix,
        mime,
        ua,
        mac,
        id64,
        kv,
        csv_frag,
        tsv_frag,
        quote_stress,
        newline_stress,
    ]
    if len(row) != TOTAL_COLS:
        raise RuntimeError(f"row columns = {len(row)}, expected {TOTAL_COLS}")
    return row


def write_super() -> None:
    rng = random.Random(20260422)
    base = datetime(2010, 1, 1)
    header = _build_super_header()
    EXAMPLE_DIR.mkdir(parents=True, exist_ok=True)

    with SUPER_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=",", quotechar='"', quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        # 3 meta rows, keep column count consistent with header width
        pad = [""] * (TOTAL_COLS - 3)
        w.writerow(["meta", "Title", "Super Huge Example CSV"] + pad)
        w.writerow(["meta", "Author", "CSV_CUSTOM_PRO"] + pad)
        w.writerow(["meta", "About", f"{SUPER_ROWS} rows × {TOTAL_COLS} cols for stress testing"] + pad)
        w.writerow(header)
        for i in range(1, SUPER_ROWS + 1):
            w.writerow(_super_row(rng, i, base))


def _read_existing_complex_rows() -> tuple[list[str], list[list[str]]]:
    """
    Read the current complex_test.csv and keep its header + all existing rows.
    We'll later pad/truncate them to TOTAL_COLS.
    """
    with COMPLEX_PATH.open("r", newline="", encoding="utf-8") as f:
        r = csv.reader(f, delimiter=",", quotechar='"')
        rows = list(r)
    if not rows:
        raise RuntimeError("complex_test.csv is empty")
    header = rows[0]
    body = rows[1:]
    return header, body


def _pad(row: list[str], n: int) -> list[str]:
    if len(row) >= n:
        return row[:n]
    return row + [""] * (n - len(row))


def write_complex() -> None:
    rng = random.Random(20260422 + 7)

    header0, body0 = _read_existing_complex_rows()
    # Keep the original 12-column header intact and extend to TOTAL_COLS.
    header = _pad(header0, TOTAL_COLS)

    # Start with existing hand-crafted rows, padded.
    out_rows: list[list[str]] = [_pad(r, TOTAL_COLS) for r in body0]

    # Generate additional "complex" rows by mutating a few fields each time.
    base = datetime(2018, 1, 1)
    while len(out_rows) < COMPLEX_ROWS:
        i = len(out_rows) + 1
        row = _super_row(rng, i, base)
        # Make it nastier: inject commas/quotes/newlines sporadically.
        if i % 17 == 0:
            row[1] = 'O\'Brien, "Mary"\nline2'  # Sidekick
        if i % 29 == 0:
            row[9] = "0.000000000123"  # Speed
        if i % 41 == 0:
            row[30] = json.dumps({"k": 'v, "q"\n', "n": i}, ensure_ascii=False)  # JSON
        if i % 53 == 0:
            row[58] = 'a,"b""b",c\nx,y,z'  # QuoteStress-ish
        if i % 97 == 0:
            row[13] = "x@y.z"  # Email edge
        out_rows.append(row)

    with COMPLEX_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=",", quotechar='"', quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        w.writerow(header)
        for r in out_rows[:COMPLEX_ROWS]:
            w.writerow(r)


def main() -> None:
    if not COMPLEX_PATH.exists():
        raise SystemExit(f"Missing {COMPLEX_PATH} (expected existing hand-crafted fixture).")
    write_super()
    write_complex()
    print(f"Wrote {SUPER_PATH} and {COMPLEX_PATH}")


if __name__ == "__main__":
    main()

