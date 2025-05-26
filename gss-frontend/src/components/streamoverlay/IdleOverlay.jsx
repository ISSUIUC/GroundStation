import { useEffect, useState } from "react";
import { ShowPathExact } from "../reusable/UtilityComponents";
import { CountdownTimer } from "./CountdownTimer";
import "./StreamCommon.css"

const IDLE_INFO = [
    "We have 12 seperate video sources looking at this rocket! 5 of them are active on the livestream.",
    "Aether was originally called 'Kairos III'! Dodged a bullet with that one.",
    "60% of our leadership team members are sophomores! (20% seniors, 20% juniors)",
    "Aether has 31.07 pounds of propellant! That's 41.7% of the total vehicle mass!",
    "Aether is flying a high-altitude reefing system designed in-house. Its components are named after landmarks and fauna found in the Alps.",
    "Aether's in-house developed recovery system is 100% 3D printed!",
    "Aether will be flying supersonic for over a minute! (61.5 seconds, to be exact)",
    "Aether pulls 25Gs at liftoff! That's 25x the amount of acceleration you're being pulled down by the earth!",
    "Our team formed 4 years ago! We started our roots at IREC, but moved to high altitude launches last year.",
    "Aether breaks the sound barrier after just 1.56 seconds of flight!",
    "To avoid damaging the rocket on landing, our rocket uses a reefing system to descend at a nice, gentle 25.6 ft/s!",
    "This is our first ever stream! Say hi in the chat if you see this message!",
    "Aether has a nominal time-to-apogee (time until it reaches the highest point) of just 92.6 seconds! The number is 27.65 seconds for the booster.",
    "This is our first rocket with a transition in it -- all of our other staged rocket attempts have had constant diameters across their lengths!",
    "All of our camera communication is happening through an in-house designed flight computer (MIDAS) and camera control board.",
    "Aether's telemetry systems are fully student-designed end-to-end! From sensor collection to telemetry operators (or stream viewers)!",
    "Aether's full stack height is 175.5\" tall (4.45m)!",
    "Our rocket's booster parachute is over 5 feet wide, but weighs only 6.3 oz!",
    "Our team slack has over 1,500,000 messages sent.",
    "Michael had way too much fun writing these.",
    "March 15 is the ides of march -- the same day Julius Ceasar was assassinated in 44 BCE.",
    "Aether has 2 launch windows, opening March 15th at 8:00AM PST and March 16th at the same time.",
    "MIDAS is Aether's primary telemetry and tracking computer, having been designed by our team members. It successfully controlled a 2-stage rocket in Feb 2025."
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
                            <div className="stream-idle-subtext">Aether II Launch</div>
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
                            <div className="stream-idle-subtext">Aether II Launch</div>
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
                            <div className="stream-idle-subtext">Aether II Launch</div>
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