import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Page from "../components/Page";
import { pageOf, useSiteContent } from "../site";

export default function Gallery() {
  const content = useSiteContent();
  const page = pageOf(content, "gallery");
  const labels = content.labels || {};
  const categories = content.categories || [];
  const workPhotos = content.gallery || [];
  const [params, setParams] = useSearchParams();
  const requested = params.get("category");
  const active = categories.some((item) => item.id === requested) ? requested : "all";
  const photos = useMemo(
    () => (active === "all" ? workPhotos : workPhotos.filter((photo) => photo.category === active)),
    [active, workPhotos]
  );
  const [open, setOpen] = useState(null);
  const dialog = useRef(null);
  const photo = open == null ? null : photos[open];

  useEffect(() => {
    setOpen(null);
  }, [active]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return undefined;
    if (open == null) {
      if (node.open) node.close();
      return undefined;
    }
    if (!node.open) node.showModal();
    function onKey(event) {
      if (event.key === "ArrowRight") setOpen((current) => (current == null ? current : (current + 1) % photos.length));
      if (event.key === "ArrowLeft") setOpen((current) => (current == null ? current : (current - 1 + photos.length) % photos.length));
    }
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  function choose(id) {
    if (id === "all") setParams({});
    else setParams({ category: id });
  }

  return (
    <Page
      kicker={page.kicker || "On site"}
      title={page.title || "Work from food plants and the rooms around them."}
      lede={page.lede || "Photographs from food and meat processing, the equipment wash, and the offices and staff amenities that sit with those plants."}
    >
      <div className="filters" role="tablist" aria-label={labels.galleryFilters || "Photograph categories"}>
        <button type="button" className={active === "all" ? "is-on" : ""} onClick={() => choose("all")}>
          {labels.galleryAll || "All"} <span>{workPhotos.length}</span>
        </button>
        {categories.map((item) => (
          <button key={item.id} type="button" className={active === item.id ? "is-on" : ""} onClick={() => choose(item.id)}>
            {item.title} <span>{workPhotos.filter((photo) => photo.category === item.id).length}</span>
          </button>
        ))}
      </div>
      {active !== "all" && <p className="filter-note">{categories.find((item) => item.id === active)?.text}</p>}
      <div className="work-grid">
        {photos.map((item, index) => (
          <figure key={item.src}>
            <button type="button" className="gallery-open" onClick={() => setOpen(index)} aria-label={item.alt}>
              <img src={item.src} alt={item.alt} />
            </button>
            <figcaption>
              <strong>{categories.find((category) => category.id === item.category)?.title || item.caption}</strong>
              {item.alt}
            </figcaption>
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-label={photo?.alt || "Photograph"}
        onClose={() => setOpen(null)}
        onClick={(event) => {
          if (event.target.closest("img, button, .photo-dialog-bar")) return;
          dialog.current?.close();
        }}
      >
        {photo && (
          <div className="photo-dialog-frame">
            <div className="photo-dialog-bar">
              <p>
                <span>{categories.find((category) => category.id === photo.category)?.title || photo.caption}</span>
                {photo.alt}
              </p>
              {photos.length > 1 && <em>{open + 1} / {photos.length}</em>}
              <button type="button" className="photo-close" onClick={() => dialog.current?.close()} aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="photo-stage">
              {photos.length > 1 && (
                <button type="button" className="photo-nav prev" onClick={() => setOpen((current) => (current - 1 + photos.length) % photos.length)} aria-label="Previous photograph">
                  <span aria-hidden="true">‹</span>
                </button>
              )}
              <img key={photo.src} src={photo.src} alt={photo.alt || ""} />
              {photos.length > 1 && (
                <button type="button" className="photo-nav next" onClick={() => setOpen((current) => (current + 1) % photos.length)} aria-label="Next photograph">
                  <span aria-hidden="true">›</span>
                </button>
              )}
            </div>
          </div>
        )}
      </dialog>
    </Page>
  );
}
