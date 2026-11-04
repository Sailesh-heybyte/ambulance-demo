import { APP_NAME } from '../../mock/app';
import './Splash.scss';

export default function Splash() {
  return (
    <div className="splash">
      <div className="splash__logo">
        <i className="bi bi-truck-front-fill" />
      </div>
      <h1>{APP_NAME}</h1>
      <p>Help, on the way.</p>
    </div>
  );
}