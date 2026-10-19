"""Turn certificate PDFs into images the website can show.

Drop a PDF in client/public/certificates and run:

    python scripts/render-certificates.py

A one-page file becomes the same name with .jpg.
Extra pages become name-2.jpg, name-3.jpg, and so on.
The site reads client/src/certificateImages.json, so a new PDF
appears once its record in client/src/workPhotos.js points at that file.
"""
import json
from pathlib import Path

import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "client" / "public" / "certificates"
MANIFEST = ROOT / "client" / "src" / "certificateImages.json"


def render_pdf(pdf_path):
    document = pdfium.PdfDocument(str(pdf_path))
    urls = []
    total = len(document)
    for index in range(total):
        name = f"{pdf_path.stem}.jpg" if total == 1 else f"{pdf_path.stem}-{index + 1}.jpg"
        image = document[index].render(scale=2).to_pil().convert("RGB")
        image.save(FOLDER / name, format="JPEG", quality=86, optimize=True)
        urls.append(f"/certificates/{name}")
    document.close()
    return urls


def main():
    manifest = {}
    for pdf_path in sorted(FOLDER.glob("*.pdf")):
        manifest[pdf_path.stem] = render_pdf(pdf_path)
        print(f"{pdf_path.name} -> {len(manifest[pdf_path.stem])} image(s)")
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
