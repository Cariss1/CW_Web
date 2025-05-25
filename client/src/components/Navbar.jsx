
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  return (
    <nav>
      <button onClick={() => navigate('/')}>Головна</button>
      {role === 'admin' && (
        <button onClick={() => navigate('/admin')}>Адмін-панель</button>
      )}
    </nav>
  );
}

export default Navbar;
