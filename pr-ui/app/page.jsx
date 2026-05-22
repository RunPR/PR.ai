"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMsg("That doesn't look right.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <main className={styles.main}>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>PR</span>
          <span className={styles.logoDot}>.</span>
          <span className={styles.logoTail}>ai</span>
        </div>
        <div className={styles.navMeta}>
          <span>v0.1 · private alpha</span>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroLabel}>
          <span className={styles.labelDot} />
          <span>For marathon runners chasing a time</span>
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.line}>A coach that knows</span>
          <span className={styles.line}>
            your <em>goal</em>,
          </span>
          <span className={styles.line}>
            your <em>plan</em>,
          </span>
          <span className={styles.line}>
            and your <em>life</em>.
          </span>
        </h1>

        <p className={styles.heroSub}>
          After every run, an AI distance coach reads your data, weighs your
          sleep and stress, and tells you exactly what to do next — tied to your
          goal time, not generic advice.
        </p>

        {/* SIGNUP */}
        <form className={styles.signup} onSubmit={handleSubmit}>
          <div className={styles.signupRow}>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className={styles.input}
              disabled={status === "loading" || status === "success"}
              aria-label="Email address"
            />
            <button
              type="submit"
              className={styles.button}
              disabled={status === "loading" || status === "success"}
            >
              {status === "loading" && "Joining…"}
              {status === "success" && "On the list ✓"}
              {status !== "loading" && status !== "success" && "Join waitlist"}
            </button>
          </div>
          <div className={styles.signupMeta}>
            {status === "error" && (
              <span className={styles.error}>{errorMsg}</span>
            )}
            {status === "success" && (
              <span className={styles.success}>
                You'll hear from us before public beta.
              </span>
            )}
            {(status === "idle" || status === "loading") && (
              <span className={styles.metaText}>
                No spam. One email when alpha opens.
              </span>
            )}
          </div>
        </form>
      </section>

      {/* COMPETITIVE FRAME */}
      <section className={styles.frame}>
        <div className={styles.frameInner}>
          <div className={styles.frameHeader}>
            <span className={styles.frameNum}>01</span>
            <span className={styles.frameLabel}>The space we're in</span>
          </div>

          <div className={styles.compareGrid}>
            <div className={styles.compareRow}>
              <span className={styles.compareName}>Strava</span>
              <span className={styles.compareTask}>
                tells you what you <em>did</em>.
              </span>
            </div>
            <div className={styles.compareRow}>
              <span className={styles.compareName}>Garmin</span>
              <span className={styles.compareTask}>
                tells you what to <em>run</em>.
              </span>
            </div>
            <div className={styles.compareRow}>
              <span className={styles.compareName}>Runna</span>
              <span className={styles.compareTask}>
                gives you a <em>plan</em>.
              </span>
            </div>
            <div className={`${styles.compareRow} ${styles.compareRowUs}`}>
              <span className={styles.compareName}>PR.ai</span>
              <span className={styles.compareTask}>
                makes all of it fit <em>your life and your goal</em>.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE DEBRIEF */}
      <section className={styles.sample}>
        <div className={styles.sampleInner}>
          <div className={styles.frameHeader}>
            <span className={styles.frameNum}>02</span>
            <span className={styles.frameLabel}>What you get, every run</span>
          </div>

          <div className={styles.sampleGrid}>
            <div className={styles.sampleMeta}>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Run</span>
                <span className={styles.metaVal}>16mi long · 9:08/mi · 152 bpm</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Context</span>
                <span className={styles.metaVal}>Sleep 7.5h · Energy 4/5 · Stress 2/5</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Goal</span>
                <span className={styles.metaVal}>Sub 4:00 · Chicago · Oct 11</span>
              </div>
            </div>

            <div className={styles.debrief}>
              <div className={styles.debriefHeader}>The Debrief</div>
              <p>
                Quality long run. Your sub-4 goal requires a 9:09 average — you
                just ran 16mi at 9:08 with a 7/10 effort and good sleep. The
                aerobic base is tracking. The Z3 creep to 30% is worth watching
                as mileage climbs; on a true long run you'd ideally keep that
                closer to 10–15%.
              </p>
              <p>
                The late fatigue in miles 14–15 is normal at this distance.
                Holding pace through it, rather than surrendering to it, is the
                more important signal.
              </p>

              <div className={styles.debriefHeader} style={{ marginTop: "1.4rem" }}>
                The Week Ahead
              </div>
              <p>
                Long run is done — protect it. Tue/Wed easy (Z1–Z2 only).
                Thursday's quality session is earned, go into it. Friday genuine
                recovery. Saturday 6–8mi easy. As mileage climbs toward your
                20-miler, start practicing running by feel on easy days, not
                just by pace.
              </p>
            </div>
          </div>

          <div className={styles.sampleCaption}>
            <span className={styles.captionAsterisk}>*</span>
            Actual output from our coaching prompt, run on this athlete's data.
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.logo}>
            <span className={styles.logoMark}>PR</span>
            <span className={styles.logoDot}>.</span>
            <span className={styles.logoTail}>ai</span>
          </span>
        </div>
        <div className={styles.footerRight}>
          <span>© 2026</span>
          <span className={styles.footerSep}>·</span>
          <span>Built for the back half.</span>
        </div>
      </footer>
    </main>
  );
}
