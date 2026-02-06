const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, all, get, close } = require('./db');

// Sample articles for each category
const sampleArticles = [
  // Credit Scoring (id: 11)
  {
    title: "How Machine Learning is Revolutionizing Credit Scoring in 2026",
    url: "https://example.com/ml-credit-scoring-2026",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-05",
    content: "Machine learning models are transforming how lenders assess creditworthiness. Traditional FICO scores relied on limited data points, but modern ML algorithms can analyze thousands of variables to provide more accurate risk assessments. Companies like Upstart and Zest AI are leading this transformation, showing that alternative data sources can help expand credit access while maintaining or improving default rates.",
    summary: "Machine learning is transforming credit scoring by analyzing thousands of variables beyond traditional FICO factors, expanding credit access while maintaining accuracy.",
    relevance_score: 9,
    difficulty_level: "intermediate",
    category_id: 11,
    status: "approved"
  },
  {
    title: "Fair Lending and AI: Balancing Innovation with Equity",
    url: "https://example.com/fair-lending-ai",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-04",
    content: "As AI becomes central to credit decisions, ensuring algorithmic fairness is paramount. Regulators are increasingly scrutinizing ML models for disparate impact on protected classes. This article explores how lenders can implement explainable AI systems that satisfy both business objectives and fair lending requirements.",
    summary: "Regulators are scrutinizing AI credit models for fairness. Lenders must balance innovation with explainable systems that meet fair lending requirements.",
    relevance_score: 8,
    difficulty_level: "advanced",
    category_id: 11,
    status: "approved"
  },
  {
    title: "Alternative Data in Credit Scoring: What Works and What Doesn't",
    url: "https://example.com/alternative-data-credit",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-03",
    content: "From utility payments to rental history, alternative data sources promise to help lenders serve thin-file consumers. But not all alternative data is created equal. This analysis examines which data sources have proven predictive value and which may introduce unwanted bias.",
    summary: "Alternative data like utility and rental payments can help thin-file borrowers, but lenders must carefully evaluate which sources add predictive value without bias.",
    relevance_score: 8,
    difficulty_level: "beginner",
    category_id: 11,
    status: "approved"
  },

  // Fraud Detection (id: 12)
  {
    title: "Real-Time Fraud Detection: How Banks Are Using AI to Stop Criminals",
    url: "https://example.com/realtime-fraud-ai",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-05",
    content: "Modern fraud detection systems can analyze transactions in milliseconds, flagging suspicious activity before it completes. Deep learning models trained on billions of transactions can identify patterns invisible to rule-based systems. Major banks report 40% reductions in fraud losses after implementing AI-powered detection.",
    summary: "AI fraud detection analyzes transactions in milliseconds, with deep learning models identifying patterns invisible to traditional rule-based systems.",
    relevance_score: 9,
    difficulty_level: "intermediate",
    category_id: 12,
    status: "approved"
  },
  {
    title: "Synthetic Identity Fraud: The $6 Billion Problem AI is Solving",
    url: "https://example.com/synthetic-identity-fraud",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-04",
    content: "Synthetic identity fraud, where criminals create fake identities using combinations of real and fabricated information, costs lenders billions annually. AI systems can detect these manufactured identities by analyzing patterns across data sources that human analysts would miss.",
    summary: "Synthetic identity fraud costs billions annually. AI detects fake identities by finding patterns across data sources that human analysts would miss.",
    relevance_score: 8,
    difficulty_level: "intermediate",
    category_id: 12,
    status: "approved"
  },

  // Credit Risk (id: 13)
  {
    title: "AI-Powered Portfolio Risk Management: A New Era for Lenders",
    url: "https://example.com/ai-portfolio-risk",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-05",
    content: "Managing credit portfolio risk has traditionally relied on static models updated quarterly. AI systems can now provide continuous risk assessment, adjusting for macroeconomic changes in real-time. This dynamic approach helps lenders respond faster to emerging risks.",
    summary: "AI enables continuous portfolio risk assessment, replacing static quarterly models with dynamic systems that respond to macroeconomic changes in real-time.",
    relevance_score: 9,
    difficulty_level: "advanced",
    category_id: 13,
    status: "approved"
  },
  {
    title: "Stress Testing with AI: Preparing for Economic Uncertainty",
    url: "https://example.com/ai-stress-testing",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-03",
    content: "Traditional stress testing scenarios may not capture the full range of economic possibilities. Machine learning models can generate thousands of plausible scenarios, helping banks better understand their exposure to tail risks and prepare for unlikely but severe events.",
    summary: "ML models generate thousands of stress test scenarios, helping banks understand tail risks and prepare for severe but unlikely economic events.",
    relevance_score: 8,
    difficulty_level: "advanced",
    category_id: 13,
    status: "approved"
  },

  // Income & Employment (id: 14)
  {
    title: "AI Income Verification: Beyond Pay Stubs and Tax Returns",
    url: "https://example.com/ai-income-verification",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-05",
    content: "Traditional income verification requires borrowers to submit documentation that can be forged or outdated. AI systems can now verify income in real-time through bank transaction analysis, providing more accurate and current information while reducing friction for borrowers.",
    summary: "AI verifies income through real-time bank transaction analysis, providing more accurate data than traditional pay stubs while reducing borrower friction.",
    relevance_score: 9,
    difficulty_level: "beginner",
    category_id: 14,
    status: "approved"
  },
  {
    title: "Gig Economy Lending: How AI is Helping Non-Traditional Workers",
    url: "https://example.com/gig-economy-lending",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-04",
    content: "Traditional underwriting struggles with gig workers who have variable income streams. AI models can analyze patterns in irregular income to assess creditworthiness, opening lending opportunities for millions of workers in the growing gig economy.",
    summary: "AI analyzes variable income patterns to help gig workers qualify for credit that traditional underwriting models would deny.",
    relevance_score: 8,
    difficulty_level: "beginner",
    category_id: 14,
    status: "approved"
  },

  // Regulatory & Compliance (id: 15)
  {
    title: "Model Risk Management: Meeting Regulatory Expectations for AI",
    url: "https://example.com/model-risk-ai",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-05",
    content: "The OCC and Federal Reserve have clear expectations for model risk management. As AI models become more complex, meeting these requirements becomes more challenging. This article examines best practices for documenting, validating, and monitoring ML models in regulated environments.",
    summary: "Regulatory model risk management requirements are challenging for complex AI. Best practices include thorough documentation, validation, and continuous monitoring.",
    relevance_score: 9,
    difficulty_level: "advanced",
    category_id: 15,
    status: "approved"
  },
  {
    title: "Explainable AI in Lending: What Regulators Really Want",
    url: "https://example.com/explainable-ai-lending",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-03",
    content: "The CFPB requires lenders to provide adverse action notices explaining why credit was denied. With AI models, this explanation requirement becomes technically challenging. New XAI techniques are helping lenders meet these obligations while using sophisticated models.",
    summary: "CFPB adverse action requirements challenge AI lenders. New explainable AI techniques help meet obligations while using sophisticated models.",
    relevance_score: 8,
    difficulty_level: "intermediate",
    category_id: 15,
    status: "approved"
  },

  // Lending Automation (id: 16)
  {
    title: "Instant Decisions: How AI is Transforming Loan Underwriting",
    url: "https://example.com/instant-underwriting",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-05",
    content: "Loan decisions that once took days or weeks can now happen in seconds. AI-powered underwriting systems analyze applications instantly, providing approvals for qualified borrowers while flagging complex cases for human review. This speed improves customer experience and reduces operational costs.",
    summary: "AI underwriting delivers instant loan decisions, approving qualified borrowers in seconds while routing complex cases for human review.",
    relevance_score: 9,
    difficulty_level: "beginner",
    category_id: 16,
    status: "approved"
  },
  {
    title: "The Human-AI Partnership in Credit Decisions",
    url: "https://example.com/human-ai-credit",
    source: "AI Credit News Editorial",
    author: "Editorial Team",
    published_date: "2026-02-04",
    content: "The most effective lending operations combine AI efficiency with human judgment. This hybrid approach uses algorithms for routine decisions while escalating edge cases to experienced underwriters. The result is both speed and accuracy.",
    summary: "Effective lending combines AI for routine decisions with human underwriters for edge cases, achieving both speed and accuracy.",
    relevance_score: 8,
    difficulty_level: "beginner",
    category_id: 16,
    status: "approved"
  }
];

async function seedArticles() {
  // DISABLED: Do not seed sample/fake articles
  // The site should only show real scraped articles
  // If you need content, run: npm run scrape && npm run process
  console.log('Sample article seeding is disabled. Only real scraped articles will be shown.');
  console.log('To populate articles, run: npm run scrape && npm run process');
  return;
}

// First editorial content
const firstEditorial = {
  title: "AI in Credit: The Week That Was",
  content: `The convergence of artificial intelligence and credit decisioning reached a new inflection point this week. From breakthrough machine learning models to regulatory developments, the landscape continues to evolve at a pace that demands attention from every stakeholder in the financial services industry.

Machine learning's impact on credit scoring continues to expand beyond traditional boundaries. This week's developments highlight how alternative data sources—from utility payments to rental history—are enabling lenders to reach previously underserved populations while maintaining, and often improving, risk prediction accuracy. The key insight: it's not just about having more data, but about having the right algorithms to extract meaningful signals.

Fraud detection remains a critical battleground. As synthetic identity fraud costs the industry billions annually, AI-powered systems are proving essential for detecting these manufactured identities by finding patterns across data sources that human analysts would miss. The sophistication of fraud attempts continues to escalate, but so does our ability to counter them.

On the regulatory front, model risk management requirements are becoming increasingly rigorous. The message from regulators is clear: explainability is not optional. Financial institutions must demonstrate they understand how their AI models make decisions and can articulate that to both regulators and consumers. The CFPB's focus on adverse action notices adds another layer of complexity that requires innovative XAI solutions.

Perhaps most significantly, we're seeing the emergence of effective human-AI partnerships in lending operations. The most successful institutions aren't replacing human judgment with algorithms—they're augmenting it. AI handles routine decisions with speed and consistency while escalating complex cases to experienced underwriters who bring nuanced judgment to edge cases.

Looking ahead, watch for continued developments in real-time income verification, where AI is replacing static documentation with dynamic transaction analysis. This shift has profound implications for how we assess affordability and creditworthiness in an economy increasingly defined by variable income streams.

The week ahead promises more innovation, more regulatory scrutiny, and more opportunities for those who can navigate this rapidly evolving landscape. Stay informed, stay adaptive, and stay ahead.`,
  week_start: "2026-01-30",
  week_end: "2026-02-05"
};

async function seedEditorial() {
  console.log('Seeding editorial...');

  try {
    // Check if we already have a published editorial
    const existingEditorial = await get('SELECT COUNT(*) as count FROM editorials WHERE status = ?', ['published']);

    if (existingEditorial && existingEditorial.count > 0) {
      console.log('Already have a published editorial, skipping seed.');
      return;
    }

    // Insert and publish the editorial
    const result = await run(
      `INSERT INTO editorials (title, content, week_start, week_end, status, published_at, ai_generated_at)
       VALUES (?, ?, ?, ?, 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [firstEditorial.title, firstEditorial.content, firstEditorial.week_start, firstEditorial.week_end]
    );

    console.log(`Editorial created and published with ID: ${result.lastID}`);

  } catch (err) {
    console.error('Error seeding editorial:', err);
  }
}

module.exports = { seedArticles, seedEditorial };

// Run directly if called from command line
if (require.main === module) {
  Promise.all([seedArticles(), seedEditorial()])
    .then(() => close())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
