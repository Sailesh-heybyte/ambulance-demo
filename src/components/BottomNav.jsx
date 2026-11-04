import { NavLink } from 'react-router-dom';
import './BottomNav.scss';

const items = [
  { to: '/', icon: 'bi-house-door-fill', label: 'Home' },
  { to: '/trips', icon: 'bi-clock-history', label: 'Trips' },
  { to: '/first-aid', icon: 'bi-heart-pulse-fill', label: 'First aid' },
  { to: '/profile', icon: 'bi-person-fill', label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end className="bottom-nav__item">
          <i className={`bi ${item.icon}`} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}