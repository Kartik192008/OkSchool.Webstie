// Delivered by Originkit · stack: nextjs · styling: tailwind
/* eslint-disable */
// @ts-nocheck
"use client"
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ParticleSimulation from "@/components/originkit/ui/hero-38/particle-simulation";

export function SectionHero() {
  const [mounts, setMounts] = useState([]);
  useEffect(() => runPageScript({ ParticleSimulation }, setMounts), []);
  return (
    <div className="hero-38">
    <>
      <main className="hero" id="top">
        <header className="nav">
          <a className="brand" href="#top" aria-label="Origin home">
            origin.
          </a>
          <nav className="nav-links" aria-label="Primary navigation">
            <a href="#how">HOW IT WORKS</a>
            <a href="#benchmarks">BENCHMARKS</a>
            <a href="#docs">DOCS</a>
          </nav>
          <button className="download-btn" id="downloadBtn">
            Download
          </button>
        </header>
        <div className="ghost-word" aria-hidden="true">
          origin
        </div>
        <section
          className="visual"
          role="img"
          aria-label="Moss-covered fallen tree trunk curling into a loop"
        >
          <div className="visual__sim" id="visual-sim" />
        </section>
        <section className="bottom-layout">
          <div className="headline-block">
            <button className="dark-cta" id="howBtn">
              <span>See how it works</span>
              <span className="arrow">↗</span>
            </button>
            <h1>
              Ship code that
              <br />
              survives review
            </h1>
          </div>
          <p className="intro">
            {" "}
            Origin reads every pull request the moment it opens — catching the regression, naming
            the blast radius, and writing the patch in your codebase’s own idiom.{" "}
          </p>
          <div className="stat-grid" id="benchmarks">
            <article className="stat-card">
              <strong>94%</strong>
              <div className="stat-bottom">
                <p>of flagged defects are confirmed by the author, not dismissed.</p>
                <button aria-label="Read about review precision" className="round-link">
                  ↗
                </button>
              </div>
            </article>
            <article className="stat-card">
              <strong>40+</strong>
              <div className="stat-bottom">
                <p>languages and frameworks indexed across your repos.</p>
                <button aria-label="Open supported languages" className="round-link">
                  ↗
                </button>
              </div>
            </article>
          </div>
        </section>
        <div className="demo-panel" id="how" hidden>
          <button className="panel-close" id="closePanel" aria-label="Close">
            ×
          </button>
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>Diff → analysis → patch.</h2>
          <p>
            Origin indexes the whole repository, not just the diff — so it traces a changed function
            to every caller, flags the tests that should have failed, and opens a suggested commit
            you can take or ignore.
          </p>
        </div>
        <div id="docs" className="sr-anchor" aria-hidden="true" />
      </main>
      {mounts.map((m) => createPortal(m.element, m.el, m.id))}
    </>
    </div>
  );
}

// The section's own script, kept exactly as written so its behaviour (clicks, timers, mode
// switches) stays identical. Its OKReact.mount / ReactDOM.createRoot calls go through the
// adapter below: each "root" is an entry in the section's state, rendered as a portal into its
// element, so everything stays in the host's one React tree (no second react-dom needed).
function runPageScript({ ParticleSimulation }, setMounts) {
  let next = 0;
  const timers = [];
  const createRoot = (el) => {
    const id = "m" + next++;
    return {
      render: (element) =>
        setMounts((ms) =>
          ms.some((m) => m.id === id)
            ? ms.map((m) => (m.id === id ? { id, el, element } : m))
            : [...ms, { id, el, element }],
        ),
      unmount: () => setMounts((ms) => ms.filter((m) => m.id !== id)),
    };
  };
  const ReactDOM = { createRoot };
  const OKReact = {
    mount(Comp, el, props) {
      const root = createRoot(el);
      root.render(React.createElement(Comp, props));
      return { el, update: (next) => root.render(React.createElement(Comp, next)) };
    },
  };
  const setInterval = (...a) => (timers.push(window.setInterval(...a)), timers.at(-1));
  const setTimeout = (...a) => (timers.push(window.setTimeout(...a)), timers.at(-1));
  // The real IntersectionObserver, plus a fallback that measures the element itself: a host that
  // attaches the section before its frame renders (OriginKit's preview, hidden tabs, modals) can
  // leave the browser's first notification undelivered, and a scroll-in effect would never start.
  class IntersectionObserver {
    constructor(cb, opts = {}) {
      this.cb = cb;
      this.targets = new Set();
      this.seen = new Map();
      this.off = false;
      const th = [].concat(opts.threshold ?? 0)[0];
      this.real = new window.IntersectionObserver((entries) => {
        for (const e of entries) this.seen.set(e.target, e.isIntersecting);
        if (!this.off) cb(entries, this);
      }, opts);
      this.check = () => {
        for (const t of this.targets) {
          if (this.off || this.seen.get(t)) continue;
          const r = t.getBoundingClientRect(),
            vw = window.innerWidth,
            vh = window.innerHeight;
          const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)),
            h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
          const ratio = r.width && r.height ? (w * h) / (r.width * r.height) : 0;
          if (ratio > 0 && ratio >= th) {
            this.seen.set(t, true);
            cb(
              [
                {
                  target: t,
                  isIntersecting: true,
                  intersectionRatio: ratio,
                  boundingClientRect: r,
                },
              ],
              this,
            );
          }
        }
      };
      window.addEventListener("scroll", this.check, true);
      window.addEventListener("resize", this.check);
    }
    observe(t) {
      this.targets.add(t);
      this.real.observe(t);
      timers.push(window.setTimeout(this.check, 300), window.setTimeout(this.check, 1200));
    }
    unobserve(t) {
      this.targets.delete(t);
      this.real.unobserve(t);
    }
    disconnect() {
      this.off = true;
      this.targets.clear();
      this.real.disconnect();
      window.removeEventListener("scroll", this.check, true);
      window.removeEventListener("resize", this.check);
    }
  }

  const howBtn = document.getElementById("howBtn");
  const panel = document.getElementById("how");
  const closePanel = document.getElementById("closePanel");
  const downloadBtn = document.getElementById("downloadBtn");

  howBtn.addEventListener("click", () => {
    panel.hidden = false;
  });

  closePanel.addEventListener("click", () => {
    panel.hidden = true;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") panel.hidden = true;
  });

  downloadBtn.addEventListener("click", () => {
    const text = `ORIGIN PULL REQUEST REVIEW CHECKLIST

1. Does the diff do one thing, and does the title say which thing?
2. Trace every changed signature to its callers before approving.
3. A bug fix without a failing-test-first is a bug fix on trust.
4. Read the deleted lines as carefully as the added ones.
5. Approve the code that is there, not the code you would have written.
`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "origin-review-checklist.txt";
    link.click();
    URL.revokeObjectURL(url);
  });

  // The tree, drawn in particles over the page (no backdrop of the component's own). The sim box
  // overscans .visual by 1/0.7 so particles pushed off the trunk stay inside the frame.
  ReactDOM.createRoot(document.getElementById("visual-sim")).render(
    React.createElement(ParticleSimulation, {
      portraitImage: "/originkit/hero-38/tree.png",
      background: "transparent",
      density: 50,
      dotSize: 30,
      hover: { reach: 30, lift: 51, damping: 58 },
      style: { width: "100%", height: "100%", minWidth: 0, minHeight: 0 },
    }),
  );

  return () => {
    timers.forEach((id) => {
      window.clearInterval(id);
      window.clearTimeout(id);
    });
    setMounts([]);
  };
}
