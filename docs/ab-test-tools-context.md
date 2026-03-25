# A/B Test Tools — Original Context & Design Decisions

## Origin

These tools were born from a real revenue test on a client app. The key realization was that most A/B test results at small-to-medium app scale are not trustworthy, and there's no simple tool that tells you "ignore this" vs "pay attention to this."

## The 3 Key Learnings (from client conversation)

### 1. Every variable multiplies the noise

The more variables in a test, the more noise, and the longer/larger the test needs to run. Variables include:
- Multiple products (weekly, monthly, annual)
- Multiple result metrics (trial starts, trial conversions, LTV per user)
- Purchase button design
- Skip button design
- Product badges
- Prices
- Selling points / copy
- Hero image

Each is a separate variable. Changing more than one at a time = noisy test.

### 2. Sample size must be measured in results, not impressions

3,000 paywall views sounds large, but with 10-20 purchases per variant you have nowhere near statistical significance. Rule of thumb: ~500 results per variant to detect a 20% lift, ~1,000 for real confidence. There is a derivable formula (power analysis) — use it before starting the test, not after.

### 3. Unless you got really lean and specific on what you're testing, the sample size you need is probably higher than you think

This is the practical takeaway from points 1 and 2. Most teams underestimate required sample size because they count impressions instead of results, and because they're testing more variables than they realize.

## Design Philosophy

### Tool 1: A/B Test Evaluator (`/ab-test-evaluator`)

**Purpose:** NOT a primary results tool. It evaluates the *trustworthiness* of current A/B test results. Tells you what to ignore, what to pay attention to, and how much longer you'd need to run.

**Key design decisions:**
- **No "probability of being best"** — the user explicitly rejected this framing. Everything already provides this and it's practically misleading. Instead, use concrete statements like "you need X more samples to prove this."
- **Traffic light verdicts:** "Yes — you can pick a winner" / "Not yet — keep running" / "Probably not at this scale"
- **Per-variant expandable breakdowns** with objective data (lift %, CI, p-value, samples needed)
- **Baseline comparison:** Best performer by default, with optional override dropdown
- **Multiple variables supported** but user selects which ones to enter (avoids overwhelm). Tab/toggle to switch between result analyses.
- **Formula transparency:** Collapsible section showing the actual formulas used

### Tool 2: A/B Test Planner (`/ab-test-planner`)

**Purpose:** Before running a test, know how long it needs to run for various configurations.

**Key design decisions:**
- **Helper text for RevenueCat/Adapty** — tells users exactly where to find each metric
- **Timeline table:** For each variable × lift threshold (10%, 20%, 50%), shows days needed
- **Color-coded feasibility:** Green (<30d), Yellow (30-90d), Orange (90-180d), Red (>180d)
- **Warning callouts** when timelines are unrealistic (e.g., ">6 months")
- **Cross-links** between both tools

### Shared decisions:
- **Two separate pages** (not tabs) — different tools with different intentions
- **Variant slider 2-8** with +/- buttons
- **URL hash sharing** (same pattern as Ad Calculator) — useful for sharing test status with clients
- **localStorage persistence**
- **Bonferroni correction** for multiple comparisons, with explanation of what it means
- **LTV std dev heuristic:** 1.5 × mean (TODO: allow user override for more accuracy)
- **External library:** jstat for normal CDF/inverse and t-distribution

## Statistical Approach

### Binary outcomes (Trial Starts, Purchases)
- Two-proportion z-test
- Sample size: `n = (z_{α/2} + z_β)² × [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)²`
- 95% confidence (α = 0.05), 80% power (β = 0.8)

### Continuous outcomes (LTV/Revenue)
- Welch's two-sample t-test
- Std dev estimated as 1.5 × mean (heuristic for subscription apps)
- TODO: Accept actual std dev as optional input

### Multiple comparisons
- Bonferroni correction: α / (number of pairwise comparisons)
- With 4 variants = 6 comparisons = each test uses α = 0.0083
- UI explains this impact to the user

## Input Design

### Evaluator inputs:
- Variant count (slider 2-8)
- Variable selector (checkboxes: trial starts, purchases, LTV)
- Data table: variant name (editable), users exposed, + columns per selected variable
- For LTV: user enters total revenue (not average), we compute avg from users exposed

### Planner inputs:
- Daily paywall views
- Trial start rate (%)
- Purchase rate (%)
- Average revenue per purchaser ($)
- Variant count (slider 2-8)

## Future Improvements

- Allow user to input actual revenue std dev instead of using heuristic
- Sequential testing / early stopping recommendations
- Export results as image or PDF for sharing with stakeholders
- Integration with RevenueCat/Adapty APIs to pull metrics automatically
- Bayesian analysis mode as an alternative framing
