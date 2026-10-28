"use client";

import { useRef, useState } from "react";
import { buildTestPlan, FEEDBACK_TAGS, IMPROVEMENTS } from "../lib/playbook";
import type { FeedbackTag } from "../lib/playbook";

interface Props {
  onTrack: (action: string, payload: Record<string, string | number | boolean>) => void;
}

const QUESTIONS = [
  { id: "price", label: "Why this price?", answer: "Compare the full price with the amount you get and your own use. In this fictional example, 250 g at 18 g per cup makes 13 complete cups with 16 g left over. Spreading the full $24 bag price over those cups gives $1.85 per complete cup, rounded up to the next cent. Shipping, tax, equipment and brewing waste are excluded. Check the live coffee example below to explore the calculation." },
  { id: "process", label: "How is it developed?", answer: "A useful product story explains a decision, its intended benefit and the supporting evidence. For this fictional coffee, a real merchant would need roast logs and tasting records before making quality claims." },
  { id: "routine", label: "Will it fit my routine?", answer: "This demo product is whole bean, so you need a grinder. The live example offers one-time purchase or an optional subscription with a visible renewal interval. Exploring this answer does not select a subscription." },
] as const;

export function MerchantPlaybook({ onTrack }: Props) {
  const [selectedId, setSelectedId] = useState(IMPROVEMENTS[0].id);
  const [example, setExample] = useState<"before" | "proposed">("before");
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [feedbackTag, setFeedbackTag] = useState<FeedbackTag | null>(null);
  const [planId, setPlanId] = useState(IMPROVEMENTS[0].id);
  const [evidenceChecked, setEvidenceChecked] = useState(false);
  const [limitsChecked, setLimitsChecked] = useState(false);
  const [planNotice, setPlanNotice] = useState("");
  const lessonHeading = useRef<HTMLHeadingElement>(null);
  const planOutput = useRef<HTMLTextAreaElement>(null);
  const lesson = IMPROVEMENTS.find((item) => item.id === selectedId)!;
  const plan = IMPROVEMENTS.find((item) => item.id === planId)!;
  const question = QUESTIONS.find((item) => item.id === questionId);
  const planText = buildTestPlan(plan, evidenceChecked, limitsChecked);

  function changePlan(id: string) {
    setPlanId(id);
    setEvidenceChecked(false);
    setLimitsChecked(false);
    setPlanNotice("Draft focus changed. Review the evidence and limits for this improvement.");
    onTrack("plan_selected", { improvement: id });
  }

  return (
    <div className="merchant-playbook">
      <section id="guide-steps" className="merchant-start" aria-labelledby="merchant-start-title">
        <div>
          <p className="eyebrow">START HERE · NO TECHNICAL KNOWLEDGE NEEDED</p>
          <h2 id="merchant-start-title">A clearer page starts with a shopper’s question.</h2>
          <p>Explore seven practical improvements. See what changes, learn what evidence you need, then leave with a draft plan for your store.</p>
          <a className="merchant-primary" href="#improvements">Explore the improvements <span aria-hidden="true">↓</span></a>
        </div>
        <ol className="merchant-steps">
          <li><span>01</span><div><strong>Choose a shopper problem</strong><p>Start with a question your customers actually ask.</p></div></li>
          <li><span>02</span><div><strong>Try a clearer example</strong><p>Compare the original with a possible improvement.</p></div></li>
          <li><span>03</span><div><strong>Make one test plan</strong><p>Collect evidence before changing your store.</p></div></li>
        </ol>
        <p className="merchant-boundary">Practice only. All coffee examples and feedback are fictional. Nothing changes your store, and no sales improvement is claimed.</p>
      </section>

      <section id="improvements" className="merchant-explore" aria-labelledby="improvements-title">
        <div className="merchant-section-heading"><div><p className="eyebrow">EXPLORE IMPROVEMENTS</p><h2 id="improvements-title">What might your shoppers need?</h2></div><p>Choose a lesson. Try it before deciding what belongs on your own page.</p></div>
        <div className="merchant-lesson-layout">
          <nav className="merchant-lessons" aria-label="Improvement lessons">
            {IMPROVEMENTS.map((item, index) => (
              <button key={item.id} aria-current={selectedId === item.id ? "step" : undefined} onClick={() => {
                setSelectedId(item.id);
                setExample("before");
                setQuestionId(null);
                setFeedbackTag(null);
                onTrack("lesson_selected", { improvement: item.id });
                lessonHeading.current?.focus();
              }}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}<span aria-hidden="true">↗</span></button>
            ))}
          </nav>
          <article className="merchant-lesson" aria-labelledby="lesson-title">
            <p className="eyebrow">LESSON {IMPROVEMENTS.indexOf(lesson) + 1} OF {IMPROVEMENTS.length} · INSPIRED BY {lesson.author.toUpperCase()}</p>
            <h3 id="lesson-title" tabIndex={-1} ref={lessonHeading}>{lesson.title}</h3>
            <div className="merchant-problem"><strong>The shopper’s problem</strong><p>{lesson.problem}</p></div>
            <div className="merchant-example">
              <div className="merchant-example-top"><strong>Try the coffee example</strong><span>Fictional illustration</span></div>
              <div className="merchant-example-switch" role="group" aria-label="Lesson example">
                <button aria-pressed={example === "before"} onClick={() => { setExample("before"); onTrack("example_viewed", { improvement: lesson.id, design: "before" }); }}>Before</button>
                <button aria-pressed={example === "proposed"} onClick={() => { setExample("proposed"); onTrack("example_viewed", { improvement: lesson.id, design: "proposed" }); }}>Possible improvement</button>
              </div>
              <div className="merchant-example-copy" aria-live="polite"><p>{example === "before" ? lesson.before : lesson.proposed}</p></div>
              {example === "proposed" && lesson.id === "price" && <a href="#storefront">Try the live price calculation below ↓</a>}
              {example === "proposed" && lesson.id === "participation" && (
                <div className="merchant-participation">
                  <p><strong>What would you like to know?</strong> Optional—no purchase required.</p>
                  <div className="merchant-question-buttons">{QUESTIONS.map((item) => <button key={item.id} aria-pressed={questionId === item.id} aria-controls="merchant-answer" onClick={() => { setQuestionId(item.id); onTrack("question_explored", { question: item.id }); }}>{item.label}</button>)}</div>
                  <p id="merchant-answer" className="merchant-answer" aria-live="polite">{question?.answer ?? "Choose a question to see only the explanation you need."}</p>
                </div>
              )}
              {example === "proposed" && lesson.id === "reviews" && (
                <div className="merchant-review-exercise">
                  <p className="eyebrow">FICTIONAL PRACTICE NOTE · NOT A CUSTOMER TESTIMONIAL</p>
                  <blockquote>“I could not tell whether I needed a grinder.”</blockquote>
                  <fieldset><legend>What kind of feedback is this?</legend><div className="merchant-question-buttons">{FEEDBACK_TAGS.map((tag) => <button key={tag} aria-pressed={feedbackTag === tag} onClick={() => { setFeedbackTag(tag); onTrack("feedback_tagged", { tag, sample: "grinder-question" }); }}>{tag}</button>)}</div></fieldset>
                  <p className="merchant-answer" aria-live="polite">{feedbackTag === null ? "Choose a label, then see how to turn a theme into a useful change." : feedbackTag === "Worry" ? "A worry is the strongest fit: the shopper is uncertain about required equipment. If this recurs in real feedback and support, try adding ‘Whole bean—grinder required’ near the product choice. One practice note proves nothing." : "That label can be useful for other feedback. This note most directly expresses a worry about required equipment. Look for recurring worries in real reviews and support before choosing a change."}</p>
                </div>
              )}
            </div>
            <dl className="merchant-action-grid">
              <div><dt>What to change on your store</dt><dd>{lesson.action}</dd></div>
              <div><dt>Evidence to gather first</dt><dd>{lesson.evidence}</dd></div>
              <div><dt>What to measure</dt><dd>{lesson.metric}</dd></div>
              <div><dt>What could go wrong?</dt><dd>{lesson.downside}</dd></div>
            </dl>
            <div className="merchant-lesson-end"><a className="merchant-primary" href="#test-plan" onClick={() => changePlan(lesson.id)}>Use this in my draft plan ↓</a><details><summary>Where this idea comes from</summary><p>Educational adaptation of ideas discussed by {lesson.author}. Not affiliated with or endorsed by either author. The coffee example is our illustration, not their product claim.</p><a href={lesson.source} target="_blank" rel="noreferrer">Read the original: {lesson.sourceTitle} ↗</a></details></div>
          </article>
        </div>
      </section>

      <section id="test-plan" className="merchant-plan" aria-labelledby="test-plan-title">
        <div className="merchant-section-heading"><div><p className="eyebrow">MAKE A TEST PLAN</p><h2 id="test-plan-title">One change. A reason. A way to learn.</h2></div><p>A useful starting point for you and your team—not a launched experiment or a promise of more sales.</p></div>
        <div className="merchant-plan-grid">
          <div className="merchant-plan-controls">
            <label htmlFor="plan-focus">Choose your first improvement</label>
            <select id="plan-focus" value={planId} onChange={(event) => changePlan(event.target.value)}>{IMPROVEMENTS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
            <p><strong>Our question to test</strong>{plan.hypothesis}</p>
            <fieldset><legend>Your pre-publish checks</legend>
              <label><input type="checkbox" checked={evidenceChecked} onChange={(event) => { setEvidenceChecked(event.target.checked); onTrack("plan_check_changed", { check: "evidence", checked: event.target.checked, improvement: plan.id }); }} /><span>I have reviewed real evidence for this change.</span></label>
              <label><input type="checkbox" checked={limitsChecked} onChange={(event) => { setLimitsChecked(event.target.checked); onTrack("plan_check_changed", { check: "limits", checked: event.target.checked, improvement: plan.id }); }} /><span>I have checked the claims, limits and keyboard/mobile experience.</span></label>
            </fieldset>
            <p className="merchant-plan-warning">These are your notes, not independent verification. Before a live test, ask an analyst to help define who sees it, how much data you need and when to review the result. A small store may need customer research before a statistical test is practical.</p>
          </div>
          <div className="merchant-plan-output">
            <label htmlFor="plan-text">Your draft plan</label>
            <textarea ref={planOutput} id="plan-text" value={planText} readOnly rows={14} spellCheck={false} />
            <button className="merchant-secondary" onClick={() => { planOutput.current?.focus(); planOutput.current?.select(); setPlanNotice("Plan text selected. Use your device’s copy command to save it somewhere you control."); onTrack("plan_selected_for_copy", { improvement: plan.id }); }}>Select plan text to copy</button>
            <p className="merchant-plan-memory">Stays in this page’s memory only. Reload or Reset demo clears your choices. Save a copy yourself; nothing is sent.</p>
            <p role="status" className="merchant-plan-notice">{planNotice}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
