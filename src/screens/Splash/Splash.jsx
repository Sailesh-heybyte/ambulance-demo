import { APP_NAME } from '../../mock/app';
import AmbulanceArt from '../../components/AmbulanceArt';
import './Splash.scss';

export default function Splash() {
  return (
    <div className="splash">
      <div className="splash__art">
        <AmbulanceArt />
      </div>
      <h1>{APP_NAME}</h1>
      <p>Help, on the way.</p>
    </div>
  );
}