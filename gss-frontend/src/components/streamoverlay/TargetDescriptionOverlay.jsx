import "./StreamCommon.css"

export function TargetDescriptionOverlay({ TITLE, SUBTITLE, visible }) {
    const spot_fade_classname = visible ? "target-spot-fade-in" : "target-spot-fade-out"
    const title_fade_classname = visible ? "target-title-fade-in" : "target-title-fade-out"
    const subtitle_fade_classname = visible ? "target-subtitle-fade-in" : "target-subtitle-fade-out"
    
    const t_title = TITLE ? TITLE : ""

    return (
        <div className="stream-target-wrapper">
            <div className={`stream-target-dim-overlay start-hidden ${spot_fade_classname}`} />
            <div className={`start-hidden stream-target-desc-title ${title_fade_classname}`}>
                {t_title.toUpperCase()}
            </div>
            <div className={`start-hidden stream-target-desc-subtitle ${subtitle_fade_classname}`}>
                {SUBTITLE}
            </div>
        </div>


    );
}