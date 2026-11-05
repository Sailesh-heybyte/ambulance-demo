import GovtEmblem from '../../components/GovtEmblem';
import ProtocolLeaders from '../../components/ProtocolLeaders';
import './Splash.scss';

// Official opening screen: Govt. of AP logo in the centre, leaders at the bottom.
export default function Splash() {
  return (
    <div className="splash">
      <div className="splash__top">GOVERNMENT OF ANDHRA PRADESH</div>

      <div className="splash__center">
        <div className="splash__emblem-wrap">
          <span className="splash__halo" />
          <span className="splash__halo splash__halo--2" />
          <GovtEmblem size={128} />
        </div>

        <div className="splash__brand">
          <span className="splash__cross">
            <i className="bi bi-plus-lg" />
          </span>
          <h1>108 Ambulance</h1>
        </div>
        <p className="splash__tag">Emergency Response Service</p>
        <p className="splash__tag splash__tag--te">అత్యవసర అంబులెన్స్ సేవ</p>

        <span className="splash__loader" aria-label="Loading">
          <span />
        </span>
      </div>

      <div className="splash__protocol">
        <ProtocolLeaders variant="ribbon" size="lg" />
      </div>
    </div>
  );
}
