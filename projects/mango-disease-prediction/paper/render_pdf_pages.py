"""
Renders all pages of paper/main.pdf into high-resolution PNGs in paper/rendered_pages/
"""
import sys
from pathlib import Path
import pypdfium2 as pdfium

BASE_DIR = Path(__file__).resolve().parent.parent
PDF_PATH = BASE_DIR / "paper" / "main.pdf"
OUT_DIR = BASE_DIR / "paper" / "rendered_pages"
OUT_DIR.mkdir(parents=True, exist_ok=True)

if not PDF_PATH.exists():
    print(f"Error: {PDF_PATH} does not exist.")
    sys.exit(1)

pdf = pdfium.PdfDocument(str(PDF_PATH))
print(f"Rendering {len(pdf)} pages from {PDF_PATH} at 200 DPI...")

for i, page in enumerate(pdf):
    # scale 2.77 corresponds to ~200 DPI (72 * 2.77 ~= 200)
    img = page.render(scale=2.77).to_pil()
    out_file = OUT_DIR / f"page_{i+1}.png"
    img.save(str(out_file))
    print(f"Saved: {out_file}")

print("\n[ALL PAGES RENDERED SUCCESSFULLY]")
