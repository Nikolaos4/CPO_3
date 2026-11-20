// tone: green (по умолчанию) | gray | warn; onCover — белая подложка на обложке карточки.
export default function Badge({ tone = "green", onCover = false, children }) {
  const cls = ["badge", tone !== "green" && `badge--${tone}`, onCover && "badge--white"]
    .filter(Boolean)
    .join(" ");
  return <span className={cls}>{children}</span>;
}
