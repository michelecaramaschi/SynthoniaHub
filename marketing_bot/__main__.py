"""CLI del generatore di post marketing.

Esempi:
    python -m marketing_bot                          # argomento e piattaforma automatici
    python -m marketing_bot --platform x --lang en
    python -m marketing_bot --topic "Nuova patch analogica sul marketplace"
"""

from __future__ import annotations

import argparse
import datetime as dt
import sys

from .generator import generate_post, load_config, render_markdown, save_post


def _auto_pick(items: list, offset: int = 0):
    """Rotazione deterministica basata sul giorno dell'anno: ogni esecuzione
    giornaliera schedulata pesca un elemento diverso senza stato persistente."""
    day = dt.date.today().timetuple().tm_yday
    return items[(day + offset) % len(items)]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="marketing_bot",
        description="Genera automaticamente post marketing per Synthonia.",
    )
    parser.add_argument("--config", default="config/brand.yaml", help="percorso del file di configurazione")
    parser.add_argument("--platform", help="piattaforma di destinazione (default: rotazione automatica)")
    parser.add_argument("--topic", help="argomento del post (default: rotazione automatica)")
    parser.add_argument("--lang", help="lingua del post: it | en (default: da config)")
    parser.add_argument("--output-dir", default="posts", help="directory di salvataggio")
    parser.add_argument("--no-save", action="store_true", help="stampa il post senza salvarlo")
    args = parser.parse_args(argv)

    config = load_config(args.config)
    platforms = list(config["platforms"])

    platform = args.platform or _auto_pick(platforms)
    topic = args.topic or _auto_pick(config["topics"], offset=3)
    language = args.lang or config["defaults"]["language"]

    print(f"Genero post: piattaforma={platform}, lingua={language}", file=sys.stderr)
    print(f"Argomento: {topic}", file=sys.stderr)

    post = generate_post(config, platform=platform, topic=topic, language=language)

    if args.no_save:
        print(render_markdown(post, platform, topic, language))
    else:
        path = save_post(post, platform, topic, language, output_dir=args.output_dir)
        print(f"Post salvato in: {path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
