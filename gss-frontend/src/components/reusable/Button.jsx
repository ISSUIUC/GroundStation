import './Common.css';

export default function GSSButton({ children, onClick, variant=null, disabled=false }) {

    let v = ""
    if(variant) {
        v = "gss-button-" + variant;
    }

    let disabled_class = disabled ? "gss-button-disabled" : "";

    return (
      <div className={`gss-button ${v} ${disabled_class}`} onClick={disabled ? () => {} : onClick}>
        <div className='gss-center-vert'>
            <div className='gss-center-text'>
            {children}
            </div>
        </div>
      </div>
    );
}