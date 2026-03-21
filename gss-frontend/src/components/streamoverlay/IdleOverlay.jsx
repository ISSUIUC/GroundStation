import { useEffect, useState } from "react";
import { ShowPathExact } from "../reusable/UtilityComponents";
import { CountdownTimer } from "./CountdownTimer";
import "./StreamCommon.css"

const IDLE_INFO = [
    "Cassie is a shortening of Cassiopeia, the team's summer launch rocket",
    "Cassie is flying a high-altitude reefing system designed in-house. Its components are named after landmarks and fauna found in the Alps.",
    "We have 9 seperate video sources looking at this rocket! We're trying to make sure we capture Cassie's beauty!",
    "Cassie has the highest dynamic pressure (Max Q) value of any vehicle we have designed!",
    "Cassie's in-house developed recovery system is 100% 3D printed!",
    "Cassie pulls 32Gs at liftoff! That's 32x the amount of acceleration you're being pulled down by the earth!",
    "Our team formed 4 years ago! We started our roots at IREC, but moved to high altitude launches last year.",
    "Cassie breaks the sound barrier in under two seconds of flight!",
    "To avoid damaging the rocket on landing, our rocket uses a reefing system to descend at a nice, gentle 25 ft/s!",
    "This is our third streamed launch! Our first was Aether 1, which launched in March of 2025.",
    "Cassie is our first single staged vehicle launched since IREC 2023!",
    "All of our camera communication is happening through an in-house designed flight computer (MIDAS) and camera control board.",
    "We have a fully SRAD video system on board, meant to transmit images back to ground from the edge of space!",
    "Cassie's telemetry systems are fully student-designed end-to-end! From sensor collection to telemetry operators (or stream viewers)!",
    "Our team slack has over 2,000,000 messages sent.",
    "Michael had a bit less fun writing these than last time, but he still had fun!",
    "Cassie's maximum speed is Mach 2.2, or 2.2x the speed of sound! That's faster than the Concorde!",
    "Cassie is Aether's primary telemetry and tracking computer, having been designed by our team members. It successfully controlled a 2-stage rocket in Feb 2025.",
]

export function FunFactsOnly() {
    const [cur_fact, set_cur_fact] = useState(Math.floor(Math.random() * IDLE_INFO.length));
    const [show_fact, set_show_fact] = useState(true);

    useEffect(() => {

        const intv = setInterval(() => {
            // swap current info tidbit
            set_show_fact(false);
            setTimeout(() => {
                set_cur_fact(Math.floor(Math.random() * IDLE_INFO.length));
                set_show_fact(true);
            }, 2000);
            

        }, 15000)
        
        return () => {
            clearInterval(intv);
        }
    }, [set_cur_fact]);

    const fact_style = show_fact ? "fact-in" : "fact-out"
    return (
        <div className="stream-idle-funfact-container funfact-center">
            <div className="stream-idle-funfact-facttitle fact-title-single-large">
            Fun facts:
            </div>
            <div className={`stream-idle-funfact-fact fact-single-large`}>
                <span className={`${fact_style}`}>
                    {IDLE_INFO[cur_fact]}
                </span>
            </div>
        </div>
    );
}

export function PreStreamOverlay() {
    const [cur_fact, set_cur_fact] = useState(Math.floor(Math.random() * IDLE_INFO.length));
    const [show_fact, set_show_fact] = useState(true);

    useEffect(() => {

        const intv = setInterval(() => {
            // swap current info tidbit
            set_show_fact(false);
            setTimeout(() => {
                set_cur_fact(Math.floor(Math.random() * IDLE_INFO.length));
                set_show_fact(true);
            }, 2000);
            

        }, 15000)
        
        return () => {
            clearInterval(intv);
        }
    }, [set_cur_fact]);

    const fact_style = show_fact ? "fact-in" : "fact-out"
    return (
        <>
            <ShowPathExact path={"/stream/pre"}>
                <div className="stream-pre-bg">
                    <div className="stream-pre-text-wrap">
                        <div className="stream-idle-header">
                            <div className="stream-idle-title">Starting soon!</div>
                            <div className="stream-idle-timer">T<CountdownTimer digitmode={4} anim={false} /></div>
                            <div className="stream-idle-subtext">Cassie Launch</div>
                        </div>


                        <div className="stream-idle-funfact-container">
                            <div className="stream-idle-funfact-facttitle">
                            Fun facts:
                            </div>
                            <div className={`stream-idle-funfact-fact`}>
                                <span className={`${fact_style}`}>
                                    {IDLE_INFO[cur_fact]}
                                </span>
                            </div>
                        </div>

                        <div className="stream-idle-footer">
                            <div className="stream-idle-footer-t">Spaceshot</div>
                            <div className="stream-idle-footer-b">Illinois Space Society</div>
                        </div>
                    </div>
                </div>

            </ShowPathExact>
        </>
    );
}

export default function IdleStreamOverlay({ REASONTEXT }) {
    const [cur_fact, set_cur_fact] = useState(Math.floor(Math.random() * IDLE_INFO.length));
    const [show_fact, set_show_fact] = useState(true);

    useEffect(() => {

        const intv = setInterval(() => {
            // swap current info tidbit
            set_show_fact(false);
            setTimeout(() => {
                set_cur_fact(Math.floor(Math.random() * IDLE_INFO.length));
                set_show_fact(true);
            }, 2000);
            

        }, 15000)
        
        return () => {
            clearInterval(intv);
        }
    }, [set_cur_fact]);

    const fact_style = show_fact ? "fact-in" : "fact-out"
    return (
        <>
            <ShowPathExact path={"/stream/idle"}>
                <div className="stream-idle-bg">
                    <div className="stream-idle-text-wrap">
                        <div className="stream-idle-header">
                            <div className="stream-idle-title">We'll be back soon!</div>
                            <div className="stream-idle-timer">T<CountdownTimer digitmode={4} anim={false} /></div>
                            <div className="stream-idle-subtext">Cassie Launch</div>
                        </div>


                        <div className="stream-idle-funfact-container">
                            <div className="stream-idle-funfact-facttitle">
                            Fun facts:
                            </div>
                            <div className={`stream-idle-funfact-fact`}>
                                <span className={`${fact_style}`}>
                                    {IDLE_INFO[cur_fact]}
                                </span>
                            </div>
                        </div>

                        <div style={{fontSize: "1.5em"}}>{REASONTEXT ? REASONTEXT : ""}</div>

                        <div className="stream-idle-footer">
                            <div className="stream-idle-footer-t">Spaceshot</div>
                            <div className="stream-idle-footer-b">Illinois Space Society</div>
                        </div>
                    </div>
                </div>

            </ShowPathExact>
        </>
    );
}

export function GoodbyeStreamOverlay() {
    const [cur_fact, set_cur_fact] = useState(Math.floor(Math.random() * IDLE_INFO.length));
    const [show_fact, set_show_fact] = useState(true);

    useEffect(() => {

        const intv = setInterval(() => {
            // swap current info tidbit
            set_show_fact(false);
            setTimeout(() => {
                set_cur_fact(Math.floor(Math.random() * IDLE_INFO.length));
                set_show_fact(true);
            }, 2000);
            

        }, 15000)
        
        return () => {
            clearInterval(intv);
        }
    }, [set_cur_fact]);

    const fact_style = show_fact ? "fact-in" : "fact-out"
    return (
        <>
            <ShowPathExact path={"/stream/goodbye"}>
                <div className="stream-idle-bg">
                    <div className="stream-idle-text-wrap">
                        <div className="stream-idle-header">
                            <div className="stream-idle-title">Thank You!</div>
                            <div className="stream-idle-subtext">Cassie Launch</div>
                        </div>


                        <div className="stream-idle-funfact-container">
                            <div>
                                <div className="stream-idle-goodbye-text">
                                    The team is now beginning the rocket recovery process. Stay updated by following our social media!
                                </div>
                            </div>

                            <div className="stream-idle-mediahandle-wrap">
                                <span className="stream-idle-mediahandle">
                                    @illinoisspacesociety
                                </span>
                                    on Instagram
                            </div>
                            <div className="stream-idle-mediahandle-wrap">
                                <span className="stream-idle-mediahandle">
                                    @Illinois Space Society
                                </span>
                                    on Youtube
                            </div>
                        </div>

                        <div className="stream-idle-footer">
                            <div className="stream-idle-footer-t">Spaceshot</div>
                            <div className="stream-idle-footer-b">Illinois Space Society</div>
                        </div>
                    </div>
                </div>

            </ShowPathExact>
        </>
    );
}