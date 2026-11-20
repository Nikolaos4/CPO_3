import Icon from "./Icon.jsx";

export default function SearchInput({ value, onChange, placeholder = "Поиск по названию" }) {
  return (
    <div className="search">
      <span className="search__icon">
        <Icon name="search" />
      </span>
      <input
        className="input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
