import { useEffect, useRef, useState } from "react";

export default function Certificates({ items = [] }) {
  const records = items.filter((item) => item.image || item.images?.length);
  const slides = records.flatMap((item) => {
    const images = item.images?.length ? item.images : [item.image];
    return images.filter(Boolean).map((src) => ({ ...item, src }));
  });
  const [open, setOpen] = useState(null);
  const dialog = useRef(null);
  const slide = open == null ? null : slides[open];

  useEffect(() => {
    const node = dialog.current;
    if (!node) return undefined;
    if (open == null) {
      if (node.open) node.close();
      return undefined;
    }
    if (!node.open) node.showModal();
    function onKey(event) {
      if (event.key === "ArrowRight") setOpen((current) => (current == null ? current : (current + 1) % slides.length));
      if (event.key === "ArrowLeft") setOpen((current) => (current == null ? current : (current - 1 + slides.length) % slides.length));
    }
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [open, slides.length]);

  return (
    <>
      <div className="cert-grid">
        {records.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className="cert"
            data-reveal
            style={{ animationDelay: `${index * 90}ms` }}
            onClick={() => setOpen(slides.findIndex((entry) => entry.title === item.title && entry.src === item.image))}
          >
            <span className="cert-lift">
              {item.image && (
                <span className="cert-sheet">
                  <img src={item.image} alt="" />
                </span>
              )}
              <strong>{item.title}</strong>
              <em>{item.issuer}</em>
              <em>{item.date}</em>
              {item.detail && <p>{item.detail}</p>}
            </span>
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-label={slide?.title || "Certificate"}
        onClose={() => setOpen(null)}
        onClick={(event) => {
          if (event.target.closest("img, button, a, .photo-dialog-bar")) return;
          dialog.current?.close();
        }}
      >
        {slide && (
          <div className="photo-dialog-frame">
            <div className="photo-dialog-bar">
              <p>
                <span>{slide.issuer}</span>
                {slide.title}
                <em className="photo-dialog-meta">{slide.date}</em>
              </p>
              {slides.length > 1 && <em>{open + 1} / {slides.length}</em>}
              {slide.file?.split("?")[0].endsWith(".pdf") && <a href={slide.file} target="_blank" rel="noreferrer">PDF</a>}
              <button type="button" className="photo-close" onClick={() => dialog.current?.close()} aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="photo-stage">
              {slides.length > 1 && (
                <button type="button" className="photo-nav prev" onClick={() => setOpen((current) => (current - 1 + slides.length) % slides.length)} aria-label="Previous certificate">
                  <span aria-hidden="true">‹</span>
                </button>
              )}
              <img key={slide.src} src={slide.src} alt={slide.title} />
              {slides.length > 1 && (
                <button type="button" className="photo-nav next" onClick={() => setOpen((current) => (current + 1) % slides.length)} aria-label="Next certificate">
                  <span aria-hidden="true">›</span>
                </button>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
