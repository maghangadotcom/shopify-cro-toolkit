/** Educational adaptations, not measured results or merchant claims. */
export interface Improvement {
  id: string;
  title: string;
  author: string;
  problem: string;
  before: string;
  proposed: string;
  action: string;
  evidence: string;
  metric: string;
  downside: string;
  hypothesis: string;
  source: string;
  sourceTitle: string;
}

export const IMPROVEMENTS: readonly Improvement[] = [
  {
    id: "price", title: "Explain the price", author: "Rishi Rawat",
    problem: "A shopper sees the price but cannot tell what makes it worthwhile.",
    before: "$24 for a 250 g bag. Premium coffee.",
    proposed: "$24 buys 250 g. At an assumed 18 g per cup, that is 13 complete cups with 16 g left over. The full $24 bag price divided by 13 is $1.85 per complete cup, rounded up to the next cent. Shipping, tax, equipment and brewing waste are excluded. A smaller number adds context, not proof of quality.",
    action: "Put a useful price explanation beside the price. Explain verified product differences, show your calculation and keep the full amount visible.",
    evidence: "Confirm the actual price, pack size, typical use amount and any claimed quality differences. Do not invent a production-cost breakdown.",
    metric: "Completed purchases per product-page visitor.",
    downside: "Watch for misleading serving assumptions, margin loss and questions about hidden costs.",
    hypothesis: "If we explain what the full price buys, more shoppers may make an informed purchase without more pricing complaints.",
    source: "https://frictionless-commerce.com/blog/increase-conversions-with-price-justification/", sourceTitle: "Price justification",
  },
  {
    id: "expertise", title: "Show how you make decisions", author: "Rishi Rawat",
    problem: "A shopper has no reason to trust an unexplained claim that your product is expertly made.",
    before: "Expertly roasted. Unmatched quality.",
    proposed: "Illustrative process: choose a medium-roast profile → compare test brews for the intended cocoa and orange notes → record the recipe and results. A real merchant would need roast logs and tasting records before claiming this happened.",
    action: "Explain one consequential product decision, why it helps the buyer, and the evidence behind it. Show your process instead of adding an expert badge.",
    evidence: "Gather real process records, relevant qualifications if any, and evidence that supports the promised customer benefit.",
    metric: "Completed purchases per product-page visitor.",
    downside: "Watch for confusing technical language, unsupported authority and slower decision-making.",
    hypothesis: "If we explain a useful decision and support it with evidence, shoppers may feel more confident without needing more help.",
    source: "https://frictionless-commerce.com/blog/demonstrate-expertise/", sourceTitle: "Demonstrate expertise",
  },
  {
    id: "participation", title: "Let shoppers explore their question", author: "Rishi Rawat",
    problem: "A long product story makes people search through information that is not relevant to them.",
    before: "Read our full story to discover which details matter to you.",
    proposed: "Choose a question below to reveal a short, relevant explanation. Choosing a question does not subscribe you or change your bag.",
    action: "Offer a few optional questions that reveal useful information. Keep price, delivery, renewal terms and the buying button visible without participation.",
    evidence: "Use real pre-purchase questions from support or interviews. Check that each answer resolves the question and is easy to find with a keyboard.",
    metric: "Completed purchases per eligible visitor; question clicks are a diagnostic, not success by themselves.",
    downside: "Watch for extra work, hidden essentials, abandoned journeys and inaccessible controls.",
    hypothesis: "If shoppers can choose the information they need, they may decide more confidently without extra effort.",
    source: "https://thegood.com/insights/rishi-rawat/", sourceTitle: "Rawat interview: active participation (39:16–39:52)",
  },
  {
    id: "claims", title: "Make claims believable", author: "Rishi Rawat",
    problem: "A promise that sounds too good to be true can create doubt rather than confidence.",
    before: "Perfect coffee. Every cup. Guaranteed.",
    proposed: "Illustrative description: a medium-roast whole-bean blend intended for a rounded cup with a bright finish. Your brew method and recipe affect the result. These are fictional product notes, not a tested guarantee.",
    action: "Replace an absolute promise with a specific benefit, supporting evidence and honest limitations beside the claim.",
    evidence: "Audit each promise. Gather relevant product tests and real customer evidence; state what the evidence does not establish.",
    metric: "Completed purchases per product-page visitor.",
    downside: "Watch refunds, disappointment and support contacts. Do not hide important limits to improve clicks.",
    hypothesis: "If our promise is specific and credible, more shoppers may buy with realistic expectations.",
    source: "https://frictionless-commerce.com/blog/too-good-to-be-true/", sourceTitle: "Too good to be true",
  },
  {
    id: "tradeoffs", title: "Help shoppers compare fairly", author: "Rishi Rawat",
    problem: "A shopper cannot tell whether a product fits their priorities better than the alternatives.",
    before: "Better than every other coffee.",
    proposed: "Whole bean: you control when and how to grind, but need a grinder. Pre-ground: skips the grinding step, but the grind may not suit every brewer. The right fit depends on your equipment and routine—not a blanket winner.",
    action: "Compare meaningful, verifiable differences and trade-offs. Explain who each option suits rather than making unsupported competitor claims.",
    evidence: "Ask customers why they chose you. Verify every comparison for the exact products and conditions shown.",
    metric: "Completed purchases by shoppers for whom the product is suitable.",
    downside: "Watch wrong-fit returns, unfair comparisons and shoppers misunderstanding which options you sell.",
    hypothesis: "If we explain fit and trade-offs fairly, suitable shoppers may choose with fewer wrong-fit returns.",
    source: "https://frictionless-commerce.com/blog/us-versus-them/", sourceTitle: "Us versus them",
  },
  {
    id: "routine", title: "Make everyday use easy to picture", author: "Rishi Rawat",
    problem: "An abstract benefit leaves shoppers unsure how the product fits into their day.",
    before: "Transform your morning ritual.",
    proposed: "Illustrative routine: weigh your beans → grind for your brewer → brew with your usual recipe → adjust the next cup to taste. Whole beans require a grinder. Start with the instructions for your equipment.",
    action: "Show a realistic use sequence, required equipment and effort. Use actual product photos or a demonstration, not an idealized promise.",
    evidence: "Observe actual customers using the product. Confirm the steps, time, equipment and any safety information.",
    metric: "Completed purchases per product-page visitor.",
    downside: "Watch setup questions, unexpected effort and returns from shoppers who lacked required equipment.",
    hypothesis: "If shoppers can picture realistic use, more may choose the product that suits their routine.",
    source: "https://frictionless-commerce.com/blog/the-9-truths-about-online-shoppers/", sourceTitle: "The nine truths about online shoppers (visualization)",
  },
  {
    id: "reviews", title: "Turn customer feedback into a change", author: "Lorenzo Carreri",
    problem: "Merchants often write around their own assumptions rather than the reasons and worries customers express.",
    before: "We think shoppers want more premium-sounding language.",
    proposed: "Read detailed feedback, label recurring needs and worries, then check other evidence before choosing a change. Try tagging the fictional practice note below.",
    action: "Read and tag detailed reviews for benefits, buying reasons, valued features and worries. Count recurring themes, check support or interviews, then turn one supported theme into a page improvement.",
    evidence: "Use real customer language with permission and context. If reviews are scarce, use support chats or interviews. Competitor reviews are clues, not proof about your customers.",
    metric: "Completed purchases on the affected journey; also track the specific support question you aimed to reduce.",
    downside: "Watch for cherry-picking, privacy leaks and treating one vivid comment as representative. Review any AI-generated themes yourself.",
    hypothesis: "If we address a recurring, corroborated customer worry, more shoppers may decide confidently and ask fewer avoidable questions.",
    source: "https://getmason.io/blog/post/how-to-increase-conversion-rate-and-sales-with-reviews-mining-2/", sourceTitle: "Carreri: increase conversion rate and sales with review mining",
  },
];

export const FEEDBACK_TAGS = ["Benefit", "Buying reason", "Valued feature", "Worry"] as const;
export type FeedbackTag = (typeof FEEDBACK_TAGS)[number];

export function buildTestPlan(improvement: Improvement, evidenceChecked: boolean, limitsChecked: boolean): string {
  return [
    "My store improvement plan — a draft, not a launched test",
    `Focus: ${improvement.title}`,
    `Shopper problem: ${improvement.problem}`,
    `Change: ${improvement.action}`,
    `Hypothesis: ${improvement.hypothesis}`,
    `Evidence to collect: ${improvement.evidence}`,
    `Evidence reviewed: ${evidenceChecked ? "Marked reviewed by you" : "Still to do"}`,
    `Primary measure: ${improvement.metric}`,
    `Downside to watch: ${improvement.downside}`,
    `Claims, accessibility and limits checked: ${limitsChecked ? "Marked reviewed by you" : "Still to do"}`,
    "Before launch: define the eligible audience, baseline, sample size and duration with a qualified analyst. Keep other changes separate. Check consent and measurement. Record inconclusive outcomes honestly.",
    "This educational demo has no customer evidence, random assignment or measured results. Nothing has been published to your store.",
    `Educational source: ${improvement.source}`,
  ].join("\n\n");
}
