import { Link } from "react-router-dom";
import Badge from "./Badge.jsx";
import Icon from "./Icon.jsx";

// Карточка опроса (каталог и «Пройденные»). Все тексты выводятся как обычный React-текст
// (экранируются автоматически) — никакого dangerouslySetInnerHTML.
// footer — необязательный блок снизу (дата прохождения + «Мои ответы»).
export default function SurveyCard({ survey, footer }) {
  const completed = survey.status === "completed";
  const content = (
    <>
      <div className="survey-card__cover">
        <div className="survey-card__bars"><i /><i /><i /></div>
        <div className="survey-card__top">
          <Badge onCover>
            <Icon name="users" size={14} />
            {survey.participants_count}
          </Badge>
          <Badge tone={completed ? "gray" : "green"} onCover>
            {completed ? "Завершён" : "Активен"}
          </Badge>
        </div>
        {survey.is_private && (
          <div className="survey-card__private">
            <Badge onCover>
              <Icon name="lock" size={13} />
              Приватный
            </Badge>
          </div>
        )}
      </div>
      <div className="survey-card__body">
        <h3 className="survey-card__title">{survey.title}</h3>
        <p className="survey-card__desc">{survey.short_description}</p>
      </div>
    </>
  );

  return (
    <article className="card survey-card">
      {footer ? <div>{content}</div> : <Link to={`/surveys/${survey.survey_id}`}>{content}</Link>}
      {footer}
    </article>
  );
}
