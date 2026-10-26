import { Link } from "react-router-dom";
import { useApp } from "../state/AppContext.jsx";

/** Link that first signs in as the demo account of a role, so every view is reachable from the index. */
export default function DemoLink({ role, to, className = "dir-link", children }) {
  const { signInAs, user } = useApp();
  return (
    <Link
      to={to}
      className={className}
      onClick={() => {
        if (role && user?.role !== role) signInAs(role);
      }}
    >
      {children}
    </Link>
  );
}
