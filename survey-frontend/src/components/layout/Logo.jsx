import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";

export default function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo__mark">
        <Icon name="chart" size={20} strokeWidth={2.4} />
      </span>
      Опросник
    </Link>
  );
}
