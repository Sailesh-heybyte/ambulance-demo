import { APP_NAME } from '../../mock/app';
import AmbulanceArt from '../../components/AmbulanceArt';
import ProtocolLeaders from '../../components/ProtocolLeaders';
import './Splash.scss';

export default function Splash() {
  return (
    <div className="splash">
      <div className="splash__art">
        <AmbulanceArt />
      </div>

      <div className="splash__content">
        <h1>{APP_NAME}</h1>
        <p>108 Emergency Response Service</p>
      </div>

      <div className="splash__protocol">
        <ProtocolLeaders variant="banner" size="lg" />
      </div>
    </div>
  );
}
