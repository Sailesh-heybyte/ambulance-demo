import BrandLogo from '../../components/BrandLogo';
import ProtocolLeaders from '../../components/ProtocolLeaders';
import './Splash.scss';

// Official opening screen: Govt. of AP logo in the centre, leaders at the bottom.
export default function Splash() {
  return (
    <div className="splash">
      <div className="splash__top">GOVERNMENT OF ANDHRA PRADESH</div>

      <div className="splash__center">
        <div className="splash__emblem-wrap">
          <BrandLogo size={112} showText={false} />
        </div>

        <div className="splash__brand">
          <h1><b>108</b> Ambulance</h1>
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
