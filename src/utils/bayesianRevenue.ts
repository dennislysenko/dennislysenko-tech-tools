/**
 * Bayesian two-part model for revenue A/B testing.
 *
 * Model: revenue_per_user = purchase_rate × revenue_per_payer
 *   1. Beta-Bernoulli for purchase_rate
 *   2. Log-normal for revenue_per_payer (among those who paid)
 *
 * Outputs P2BB (Probability to Be Best) and credible intervals
 * via Monte Carlo sampling.
 */
import pkg from 'jstat';
const { jStat } = pkg;

const NUM_SAMPLES = 20_000;

interface VariantInput {
  usersExposed: number;
  purchases: number;
  /** Per-product breakdown: array of { count, pricePerUnit } */
  products: { count: number; pricePerUnit: number }[];
}

export interface BayesianResult {
  /** Probability this variant is the best (0-1) */
  p2bb: number;
  /** Mean of posterior for revenue per user */
  posteriorMean: number;
  /** 95% credible interval for revenue per 1K users */
  credibleInterval: [number, number];
  /** Revenue per 1K users (posterior mean × 1000) */
  revenuePer1K: number;
}

/**
 * Compute log-mean and log-variance from per-product payment data.
 * Each product has `count` payers at `pricePerUnit`.
 */
function logNormalParams(products: { count: number; pricePerUnit: number }[]): { logMean: number; logVar: number; totalPayers: number } {
  let totalPayers = 0;
  let sumLog = 0;
  let sumLogSq = 0;

  for (const p of products) {
    if (p.count <= 0 || p.pricePerUnit <= 0) continue;
    const logPrice = Math.log(p.pricePerUnit);
    sumLog += p.count * logPrice;
    sumLogSq += p.count * logPrice * logPrice;
    totalPayers += p.count;
  }

  if (totalPayers === 0) return { logMean: 0, logVar: 1, totalPayers: 0 };

  const logMean = sumLog / totalPayers;
  const logVar = totalPayers > 1
    ? (sumLogSq - totalPayers * logMean * logMean) / (totalPayers - 1)
    : 1; // fallback if only 1 payer

  return { logMean, logVar: Math.max(logVar, 0.001), totalPayers };
}

/**
 * Sample from the posterior of revenue-per-user for a single variant.
 * Returns an array of Monte Carlo samples.
 *
 * Purchase rate: Beta(1 + purchases, 1 + users - purchases) [uninformative prior]
 * Revenue per payer: LogNormal with Normal-Inverse-Gamma posterior
 */
function samplePosterior(variant: VariantInput): number[] {
  const { usersExposed, purchases, products } = variant;

  // Beta posterior for purchase rate
  const alphaP = 1 + purchases;
  const betaP = 1 + usersExposed - purchases;

  // Log-normal posterior for revenue per payer
  const { logMean, logVar, totalPayers } = logNormalParams(products);

  // Prior: uninformative (mu0=0, kappa0=0.001, alpha0=0.001, beta0=0.001)
  // With large n, posterior ≈ data
  const kappa0 = 0.001;
  const mu0 = 0;
  const alpha0 = 0.001;
  const beta0 = 0.001;

  const n = totalPayers;
  const kappaN = kappa0 + n;
  const muN = n > 0 ? (kappa0 * mu0 + n * logMean) / kappaN : mu0;
  const alphaN = alpha0 + n / 2;
  const betaN = beta0 + (n > 1 ? (n - 1) * logVar / 2 : 0) + (kappa0 * n * (logMean - mu0) ** 2) / (2 * kappaN);

  const samples: number[] = new Array(NUM_SAMPLES);

  for (let i = 0; i < NUM_SAMPLES; i++) {
    // Sample purchase rate from Beta posterior
    const pRate = jStat.beta.sample(alphaP, betaP);

    // Sample revenue per payer from LogNormal posterior
    let revPerPayer: number;
    if (n === 0) {
      // No payers — revenue per payer is 0
      revPerPayer = 0;
    } else {
      // Sample variance from Inverse-Gamma (= 1/Gamma)
      const tau = jStat.gamma.sample(alphaN, 1 / betaN);
      const sigma2 = 1 / tau;
      // Sample mean from Normal
      const mu = jStat.normal.sample(muN, Math.sqrt(sigma2 / kappaN));
      // Convert to log-normal sample
      revPerPayer = Math.exp(mu + Math.sqrt(sigma2) * jStat.normal.sample(0, 1) * 0); // just the mean of lognormal
      // Actually we want E[lognormal] = exp(mu + sigma2/2)
      revPerPayer = Math.exp(mu + sigma2 / 2);
    }

    samples[i] = pRate * revPerPayer;
  }

  return samples;
}

/**
 * Run Bayesian analysis on all variants.
 * Returns P2BB and credible intervals for each variant.
 */
export function bayesianRevenueTest(variants: VariantInput[]): BayesianResult[] {
  if (variants.length === 0) return [];

  // Sample posteriors for all variants
  const allSamples = variants.map((v) => samplePosterior(v));

  // Compute P2BB: for each sample, which variant has the highest revenue?
  const winCounts = new Array(variants.length).fill(0);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    let bestIdx = 0;
    let bestVal = allSamples[0][i];
    for (let v = 1; v < variants.length; v++) {
      if (allSamples[v][i] > bestVal) {
        bestIdx = v;
        bestVal = allSamples[v][i];
      }
    }
    winCounts[bestIdx]++;
  }

  return variants.map((_, idx) => {
    const samples = allSamples[idx];

    // Sort for percentiles
    const sorted = [...samples].sort((a, b) => a - b);
    const lo = sorted[Math.floor(NUM_SAMPLES * 0.025)];
    const hi = sorted[Math.floor(NUM_SAMPLES * 0.975)];

    const mean = samples.reduce((s, v) => s + v, 0) / NUM_SAMPLES;

    return {
      p2bb: winCounts[idx] / NUM_SAMPLES,
      posteriorMean: mean,
      revenuePer1K: mean * 1000,
      credibleInterval: [Math.max(0, lo * 1000), hi * 1000] as [number, number],
    };
  });
}
