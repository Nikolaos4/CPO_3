import { Link } from "react-router-dom";

// variant: primary | secondary | danger; size: md | sm.
// Если передан `to` — рисуется ссылка, иначе <button>.
export default function Button({
  variant = "primary",
  size = "md",
  block = false,
  to,
  type = "button",
  className = "",
  children,
  ...rest
}) {
  const cls = [
    "btn",
    `btn--${variant}`,
    size === "sm" && "btn--sm",
    block && "btn--block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
