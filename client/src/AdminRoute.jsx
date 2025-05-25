
import { Navigate } from 'react-router-dom';

export function AdminRoute({ children }) {
  const role = localStorage.getItem("role");
  return role === 'admin' ? children : <Navigate to="/" />;
}
