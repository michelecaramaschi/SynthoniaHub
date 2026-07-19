"""Generazione di post marketing tramite l'API Claude.

Il post viene restituito come output strutturato (Pydantic) così che
titolo, corpo, hashtag e call to action siano sempre campi validi e
separati, pronti per essere pubblicati o salvati.
"""

from __future__ import annotations

import datetime as dt
import re
from pathlib import Path

import anthropic
import yaml
from pydantic import BaseModel, Field

MODEL = "claude-opus-4-8"


class MarketingPost(BaseModel):
    """Struttura del post generato."""

    title: str = Field(description="Titolo o hook di apertura del post")
    body: str = Field(description="Corpo del post, pronto per la pubblicazione")
    hashtags: list[str] = Field(description="Hashtag senza il carattere #")
    call_to_action: str = Field(description="Frase di chiusura con invito all'azione")


def load_config(path: str | Path = "config/brand.yaml") -> dict:
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def _build_prompt(config: dict, platform: str, topic: str, language: str) -> tuple[str, str]:
    brand = config["brand"]
    plat = config["platforms"][platform]
    lang_name = {"it": "italiano", "en": "inglese"}.get(language, language)

    system = (
        f"Sei il social media manager di {brand['name']} ({brand['website']}), "
        f"\"{brand['tagline']}\".\n\n"
        f"Descrizione del brand: {brand['description']}\n"
        f"Pubblico: {brand['audience']}\n"
        f"Tono di voce: {brand['tone']}\n"
        f"Valori: {', '.join(brand['values'])}\n\n"
        "Scrivi post che sembrino scritti da una persona vera e appassionata, "
        "non da un'agenzia anonima. Niente promesse esagerate, niente gergo aziendale."
    )
    if brand.get("notes"):
        system += f"\n\nIndicazioni operative: {brand['notes']}"

    user = (
        f"Scrivi un post per {platform} in {lang_name} sull'argomento:\n"
        f"«{topic}»\n\n"
        f"Vincoli della piattaforma:\n"
        f"- Lunghezza massima del corpo: {plat['max_chars']} caratteri\n"
        f"- Numero massimo di hashtag: {plat['hashtags']}\n"
        f"- Stile: {plat['style']}"
    )
    return system, user


def generate_post(
    config: dict,
    platform: str,
    topic: str,
    language: str,
    client: anthropic.Anthropic | None = None,
) -> MarketingPost:
    """Genera un post marketing per la piattaforma e l'argomento indicati."""
    if platform not in config["platforms"]:
        valid = ", ".join(config["platforms"])
        raise ValueError(f"Piattaforma sconosciuta: {platform!r} (valide: {valid})")

    client = client or anthropic.Anthropic()
    system, user = _build_prompt(config, platform, topic, language)

    response = client.messages.parse(
        model=MODEL,
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": user}],
        output_format=MarketingPost,
    )
    return response.parsed_output


def render_markdown(post: MarketingPost, platform: str, topic: str, language: str) -> str:
    """Serializza il post in Markdown con front matter."""
    now = dt.datetime.now(dt.timezone.utc)
    hashtags = " ".join(f"#{h.lstrip('#')}" for h in post.hashtags)
    return (
        "---\n"
        f"platform: {platform}\n"
        f"topic: {topic}\n"
        f"language: {language}\n"
        f"generated_at: {now.isoformat(timespec='seconds')}\n"
        "---\n\n"
        f"# {post.title}\n\n"
        f"{post.body}\n\n"
        f"**CTA:** {post.call_to_action}\n\n"
        f"{hashtags}\n"
    )


def save_post(
    post: MarketingPost,
    platform: str,
    topic: str,
    language: str,
    output_dir: str | Path = "posts",
) -> Path:
    """Salva il post in posts/AAAA-MM-GG-piattaforma-argomento.md e ne restituisce il percorso."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    slug = re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")[:40]
    date = dt.date.today().isoformat()
    path = output_dir / f"{date}-{platform}-{slug}.md"

    path.write_text(render_markdown(post, platform, topic, language), encoding="utf-8")
    return path
