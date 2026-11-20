// Небольшой набор иконок (контурные, 24x24). Все иконки — статичный SVG, без пользовательских данных.
const PATHS = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  checkSquare: <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 12l3 3 5-6" /></>,
  pencil: <><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.7 0 4.5 1.8 4.5 4.5" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="3" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  logout: <><path d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4" /><path d="M16 8l4 4-4 4M20 12H9" /></>,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A9.8 9.8 0 0112 6c5 0 8.5 4 9.5 6a14 14 0 01-3 3.7M6.5 7.6A14 14 0 002.5 12c1 2 4.5 6 9.5 6 1.5 0 2.8-.4 4-.9" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></>,
  chart: <path d="M6 20V11M12 20V5M18 20v-7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
