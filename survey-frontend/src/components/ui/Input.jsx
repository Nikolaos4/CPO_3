import { useId } from "react";

// Поле с подписью и текстом ошибки (для форм входа/регистрации/создания опроса).
export default function Input({ label, error, id, className = "", ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={["input", error && "input--invalid", className].filter(Boolean).join(" ")}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-err` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-err`} className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
