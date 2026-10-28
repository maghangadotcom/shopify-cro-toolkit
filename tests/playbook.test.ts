import test from "node:test";
import assert from "node:assert/strict";
import { buildTestPlan, IMPROVEMENTS } from "../lib/playbook.ts";

test("each merchant lesson has a unique id, actionable evidence, downside and primary attribution", () => {
  assert.equal(IMPROVEMENTS.length, 7);
  assert.equal(new Set(IMPROVEMENTS.map((item) => item.id)).size, 7);
  for (const lesson of IMPROVEMENTS) {
    for (const field of ["title", "problem", "before", "proposed", "action", "evidence", "metric", "downside", "hypothesis"] as const) {
      assert.ok(lesson[field].trim().length > 10, `${lesson.id} has ${field}`);
    }
    assert.equal(new URL(lesson.source).protocol, "https:");
  }
  assert.ok(IMPROVEMENTS.some((item) => item.author === "Lorenzo Carreri"));
  assert.ok(IMPROVEMENTS.some((item) => item.author === "Rishi Rawat"));
});

test("draft plans default to outstanding checks and make no launch or verification claim", () => {
  const lesson = IMPROVEMENTS[0];
  const plan = buildTestPlan(lesson, false, false);
  assert.ok(plan.includes(lesson.hypothesis));
  assert.ok(plan.includes(lesson.evidence));
  assert.ok(plan.includes(lesson.downside));
  assert.ok(plan.includes(lesson.source));
  assert.match(plan, /Evidence reviewed: Still to do/);
  assert.match(plan, /Claims, accessibility and limits checked: Still to do/);
  assert.match(plan, /not a launched test/);
  assert.match(plan, /Nothing has been published to your store/);
  assert.match(plan, /no customer evidence, random assignment or measured results/);
});

test("checked plan items remain explicitly self-reported and independent", () => {
  const lesson = IMPROVEMENTS[6];
  const evidenceOnly = buildTestPlan(lesson, true, false);
  assert.match(evidenceOnly, /Evidence reviewed: Marked reviewed by you/);
  assert.match(evidenceOnly, /Claims, accessibility and limits checked: Still to do/);
  const limitsOnly = buildTestPlan(lesson, false, true);
  assert.match(limitsOnly, /Evidence reviewed: Still to do/);
  assert.match(limitsOnly, /Claims, accessibility and limits checked: Marked reviewed by you/);
  assert.match(buildTestPlan(lesson, true, true), /Record inconclusive outcomes honestly/);
});

test("generating a draft is deterministic and does not change lesson data", () => {
  const snapshot = JSON.stringify(IMPROVEMENTS);
  const first = buildTestPlan(IMPROVEMENTS[2], true, false);
  assert.equal(first, buildTestPlan(IMPROVEMENTS[2], true, false));
  assert.equal(JSON.stringify(IMPROVEMENTS), snapshot);
});
