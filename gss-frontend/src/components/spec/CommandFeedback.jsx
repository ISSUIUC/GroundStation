import React, { useEffect, useState } from 'react';
import './CommandFeedback.css';
import { hideCommandFeedback, useCommandFeedback } from '../dataflow/gssdata';

export const CommandFeedback = () => {
    const [fail, setfail] = useState(false);
    
    const cmd_stat = useCommandFeedback()
    const stage = cmd_stat.cur_state

    const stage_to_str = (st) => {
        const stages = ["REQUESTING SEND", "SENT TO SERVER", "SENT TO COMBINER", "SENT TO MIDAS", "ACKNOWLEDGED"]
        return stages[st]
    }

    const fail_stage_to_str = (st) => {
        const stages = ["NO CONNECTION", "NO COMBINER ACK", "UNABLE TO TRANSMIT", "DID NOT ACKNOWLEDGE", "FAIL_STATE"]
        return stages[st]
    }

    const to_cstring = (stage_sel) => {
        return `${stage > stage_sel ? "cmd-feedback-sdone" : ""} ${(stage==stage_sel && fail) ? "cmd-feedback-sfail" : ""}`
    }

    useEffect(() => {

        if(!cmd_stat.has_cmd) { return; }
        if(cmd_stat.has_explicit_failure) { return; }
        
        if(fail && cmd_stat.cur_state == 0) {
            console.log('unfail!')
            setfail(false);
            return;
        }

        if(!fail && (cmd_stat.cur_state != 4)) {
            const timeout = setTimeout(() => {
                setfail(true);
            }, 5000);

            return () => { clearTimeout(timeout); }
        }

    }, [fail, cmd_stat, setfail, hideCommandFeedback])

    let stg_str = stage_to_str(stage);

    let proc_text = (<span>Processing command:</span>);
    let cmd_style = "cmd-feedback-text-cmd"
    if(fail || cmd_stat.has_explicit_failure) {
        proc_text = (<span className='cmd-feedback-failtext'>FAILED:</span>);
        cmd_style += " cmd-feedback-txt-cmd-fail";
        stg_str = fail_stage_to_str(stage);
    } else if(stage == 4) {
        proc_text = (<span className='cmd-feedback-comptext'>Complete:</span>);
        cmd_style += " cmd-feedback-txt-cmd-good";
    }
    
    return (
        <div className={`cmd-feedback-wrapper ${cmd_stat.has_cmd ? "" : "cmd-feedback-hidden"}`} onClick={() => { hideCommandFeedback(); console.log("Hiding command..") }}>
            <div className='cmd-feedback-text'>
                <div className='cmd-feedback-text-titleaction'>
                    {proc_text} <span className='cmd-feedback-text-actiontext'>{stg_str}</span>
                </div>
                <div className={cmd_style}>
                    {cmd_stat.cur_cmd == "" ? "Awaiting cmd.." : cmd_stat.cur_cmd}
                </div>
            </div>
            <div className='cmd-feedback-sliders'>
                <div className={`cmd-feedback-s ${to_cstring(0)}`} />
                <div className={`cmd-feedback-s ${to_cstring(1)}`} />
                <div className={`cmd-feedback-s ${to_cstring(2)}`} />
                <div className={`cmd-feedback-s ${to_cstring(3)}`} />
            </div>
        </div>
    );
};
