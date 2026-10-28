import { test } from "node:test";
import assert from "node:assert/strict";
import { BAG_GRAMS, cupEstimate } from "../lib/buyer-guidance.ts";
import { VARIANTS } from "../lib/fixtures.ts";
import { buildTestPlan, IMPROVEMENTS } from "../lib/playbook.ts";

test("cup estimates count complete cups, disclose leftovers and round price upward", () => {
  assert.deepEqual(cupEstimate(2400, 250, 18), {
    cups: 13,
    centsPerCup: 185,
    leftoverGrams: 16,
  });
  assert.deepEqual(cupEstimate(2400, 250, 15), {
    cups: 16,
    centsPerCup: 150,
    leftoverGrams: 10,
  });
  assert.deepEqual(cupEstimate(2040, 250, 18), {
    cups: 13,
    centsPerCup: 157,
    leftoverGrams: 16,
  });
  assert.deepEqual(cupEstimate(4200, 500, 20), {
    cups: 25,
    centsPerCup: 168,
    leftoverGrams: 0,
  });
});

test("all bag sizes and selectable doses preserve complete-cup arithmetic", () => {
  for (const variant of VARIANTS) {
    const grams = BAG_GRAMS[variant.id];
    assert.ok(grams > 0, `Known bag weight for ${variant.id}`);
    for (const dose of [15, 18, 20]) {
      const estimate = cupEstimate(variant.priceCents, grams, dose);
      assert.equal(estimate.cups * dose + estimate.leftoverGrams, grams);
      assert.ok(estimate.leftoverGrams >= 0 && estimate.leftoverGrams < dose);
      assert.ok(estimate.centsPerCup * estimate.cups >= variant.priceCents);
      assert.ok((estimate.centsPerCup - 1) * estimate.cups < variant.priceCents);
    }
  }
});

test("zero-price and single-cup estimates remain finite and deterministic", () => {
  assert.deepEqual(cupEstimate(0, 20, 20), {
    cups: 1,
    centsPerCup: 0,
    leftoverGrams: 0,
  });
  assert.deepEqual(cupEstimate(125, 20, 20), {
    cups: 1,
    centsPerCup: 125,
    leftoverGrams: 0,
  });
});

test("invalid amounts and impossible dose assumptions fail instead of showing misleading math", () => {
  for (const price of [-1, 2.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => cupEstimate(price, 250, 18));
  for (const grams of [0, -1, 2.5, NaN, Infinity])
    assert.throws(() => cupEstimate(2400, grams, 18));
  for (const dose of [0, -1, 1.5, 251, NaN, Infinity])
    assert.throws(() => cupEstimate(2400, 250, dose));
});

test("every merchant lesson has a sourced, actionable and explicitly unproven draft plan", () => {
  assert.equal(IMPROVEMENTS.length, 7);
  assert.equal(new Set(IMPROVEMENTS.map((lesson) => lesson.id)).size, 7);
  for (const lesson of IMPROVEMENTS) {
    for (const field of [lesson.problem, lesson.before, lesson.proposed, lesson.action, lesson.evidence, lesson.metric, lesson.downside, lesson.hypothesis])
      assert.ok(field.length > 10);
    assert.equal(new URL(lesson.source).protocol, "https:");
    const plan = buildTestPlan(lesson, false, false);
    assert.match(plan, /a draft, not a launched test/);
    assert.ok(plan.includes(lesson.evidence));
    assert.ok(plan.includes(lesson.metric));
    assert.ok(plan.includes(lesson.downside));
    assert.ok(plan.includes(lesson.source));
    assert.equal(plan.match(/Still to do/g)?.length, 2);
    assert.match(plan, /no customer evidence, random assignment or measured results/);
    const checked = buildTestPlan(lesson, true, true);
    assert.equal(checked.match(/Marked reviewed by you/g)?.length, 2);
    assert.equal(checked.includes("Still to do"), false);
    assert.match(checked, /not a launched test/);
  }
});
