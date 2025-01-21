import './ChoiceSelect.css';

export default function ChoiceSelect({ text, alt_text="", choices, onSelect, curchoice=null }) {
    return (
      <div className={`gss-choice-select`}>
        <div className='gss-choice-text'>
            <span className='gss-choice-text-main'>{text}</span>
            <span className='gss-choice-text-alt'>{alt_text}</span>
        </div>
        <div className='gss-choice-c-wrapper'>
            {choices.map((choice_text) => {
                return <div className={`gss-choice-single ${curchoice == choice_text ? "gss-choice-selected" : ""}`} onClick={() => {
                    onSelect(choice_text);
                }}>{choice_text}</div>
            })}
        </div>
      </div>
    );
}