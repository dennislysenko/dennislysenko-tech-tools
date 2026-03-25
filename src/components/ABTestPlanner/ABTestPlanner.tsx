import { useState, useMemo, useRef, useEffect } from 'react';
import { usePlannerState } from './usePlannerState';
import { computeTimeline } from './computeTimeline';
import { formatDays, formatNumber, pairwiseComparisons, bonferroniAlpha } from '../../utils/abTestStats';
import { confirmReset } from '../../utils/fileHelpers';
import type { TimelineCell, PlannerState } from './types';
import '../AdCalculator/AdCalculator.css';
import './ABTestPlanner.css';

function feasibilityColor(f: TimelineCell['feasibility']): string {
  switch (f) {
    case 'easy': return 'var(--color-success)';
    case 'moderate': return 'var(--color-warning)';
    case 'hard': return '#FF9500';
    case 'infeasible': return '#FF3B30';
  }
}

function feasibilityBg(f: TimelineCell['feasibility']): string {
  switch (f) {
    case 'easy': return 'rgba(52, 199, 89, 0.08)';
    case 'moderate': return 'rgba(255, 149, 0, 0.08)';
    case 'hard': return 'rgba(255, 149, 0, 0.12)';
    case 'infeasible': return 'rgba(255, 59, 48, 0.08)';
  }
}

function NumberInput({
  label,
  description,
  value,
  unit,
  onChange,
  helperText,
}: {
  label: string;
  description: string;
  value: number;
  unit?: '$' | '%' | '';
  onChange: (v: number) => void;
  helperText?: string;
}) {
  const [localValue, setLocalValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focused) {
      if (unit === '%') {
        setLocalValue(value > 0 ? (value * 100).toFixed(2).replace(/\.?0+$/, '') : '');
      } else {
        setLocalValue(value > 0 ? value.toString() : '');
      }
    }
  }, [value, unit, focused]);

  return (
    <div className="calc-row">
      <div className="calc-row-label">
        <div className="calc-row-label-top">
          <span className="calc-row-label-text">{label}</span>
        </div>
        <p className="calc-row-description">{description}</p>
        {helperText && <p className="calc-row-description" style={{ fontStyle: 'italic', color: 'var(--color-gray-4)', fontSize: '12px' }}>{helperText}</p>}
      </div>
      <div className="calc-row-input-wrap">
        {unit === '$' && <span className="calc-row-unit-prefix">$</span>}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className="calc-input"
          value={localValue}
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '' || raw === '.' || /^-?\d*\.?\d*$/.test(raw)) {
              setLocalValue(raw);
              const parsed = parseFloat(raw);
              if (!isNaN(parsed)) {
                onChange(unit === '%' ? parsed / 100 : parsed);
              } else {
                onChange(0);
              }
            }
          }}
          onFocus={() => {
            setFocused(true);
            setTimeout(() => inputRef.current?.select(), 0);
          }}
          onBlur={() => setFocused(false)}
        />
        {unit === '%' && <span className="calc-row-unit-suffix">%</span>}
      </div>
    </div>
  );
}

export default function ABTestPlanner() {
  const { state, dispatch, copyShareLink } = usePlannerState();
  const [copied, setCopied] = useState(false);

  const timeline = useMemo(() => computeTimeline(state), [state]);

  const hasData = state.dailyPaywallViews > 0;

  const handleCopyLink = async () => {
    await copyShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => confirmReset(() => dispatch({ type: 'RESET_ALL' }));


  return (
    <div className="ad-calculator">
      {/* Controls */}
      <div className="calc-controls">
        <div className="variant-slider-group">
          <label className="control-label">Variants</label>
          <div className="variant-slider-row">
            <button
              className="variant-btn"
              onClick={() => dispatch({ type: 'SET_VARIANT_COUNT', count: state.variantCount - 1 })}
              disabled={state.variantCount <= 2}
            >-</button>
            <input
              type="range"
              min={2}
              max={8}
              value={state.variantCount}
              onChange={(e) => dispatch({ type: 'SET_VARIANT_COUNT', count: parseInt(e.target.value) })}
              className="variant-range"
            />
            <button
              className="variant-btn"
              onClick={() => dispatch({ type: 'SET_VARIANT_COUNT', count: state.variantCount + 1 })}
              disabled={state.variantCount >= 8}
            >+</button>
            <span className="variant-count">{state.variantCount}</span>
          </div>
        </div>
        <div className="calc-controls-right">
<button type="button" className="calc-share-btn" onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy Shareable Link'}
          </button>
          <button type="button" className="calc-reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {/* Two-column layout: inputs left, timeline right */}
      <div className="planner-layout">
        {/* Left column: inputs */}
        <div className="calc-inputs">
          <div className="calc-section">
            <h3 className="calc-section-title">Your App's Metrics</h3>
            <NumberInput
              label="Daily Paywall Views"
              description="How many users see your paywall each day."
              helperText="RevenueCat: Charts > Paywall Views. Adapty: Analytics > Paywall Views."
              value={state.dailyPaywallViews}
              unit=""
              onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'dailyPaywallViews', value: v })}
            />
            <NumberInput
              label="Trial Start Rate"
              description="Of users who see the paywall, what % start a free trial."
              helperText="RevenueCat: Charts > Trial Starts / Paywall Views."
              value={state.trialStartRate}
              unit="%"
              onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'trialStartRate', value: v })}
            />
            <NumberInput
              label="Purchase Rate"
              description="Of users who see the paywall, what % eventually make a purchase."
              helperText="RevenueCat: Charts > Initial Conversions / Paywall Views."
              value={state.purchaseRate}
              unit="%"
              onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'purchaseRate', value: v })}
            />
            <NumberInput
              label="Average Revenue Per Purchaser"
              description="Average LTV or subscription price per paying user."
              helperText="Use the price of your most popular plan as a starting estimate."
              value={state.averageRevenue}
              unit="$"
              onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'averageRevenue', value: v })}
            />
          </div>
        </div>

        {/* Right column: timeline results (sticky sidebar) */}
        <aside className="planner-sidebar">
          {hasData && timeline.length > 0 ? (
            <div className="calc-section">
              <h3 className="calc-section-title">How long will your test take?</h3>

              <p className="timeline-intro">
                Days needed to confidently detect a given lift, with {state.variantCount} variants
                {state.variantCount > 2 && (
                  <> (Bonferroni-corrected for {pairwiseComparisons(state.variantCount)} comparisons)</>
                )}.
                Based on 95% confidence and 80% power.
              </p>

              <div className="timeline-table-wrap">
                <table className="timeline-table">
                  <thead>
                    <tr>
                      <th className="tl-variable">Variable</th>
                      <th className="tl-cell">10%</th>
                      <th className="tl-cell">20%</th>
                      <th className="tl-cell">50%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.map((row) => (
                      <tr key={row.variableKey}>
                        <td className="tl-variable">{row.variable}</td>
                        {[row.lift10, row.lift20, row.lift50].map((cell, i) => (
                          <td
                            key={i}
                            className="tl-cell"
                            style={{
                              color: feasibilityColor(cell.feasibility),
                              background: feasibilityBg(cell.feasibility),
                            }}
                          >
                            <span className="tl-days">{formatDays(cell.daysNeeded)}</span>
                            <span className="tl-samples">{formatNumber(cell.samplesPerVariant)}/var</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warnings */}
              {timeline.some((r) =>
                [r.lift10, r.lift20].some((c) => c.feasibility === 'infeasible'),
              ) && (
                <div className="planner-warning">
                  <span className="warning-icon">&#x26A0;</span>
                  <div>
                    <strong>Some timelines are unrealistic.</strong>
                    <p>
                      At {state.dailyPaywallViews.toLocaleString()} daily views split across {state.variantCount} variants,
                      detecting small lifts in low-frequency events (like purchases) will take a very long time.
                      Consider fewer variants or higher-frequency metrics.
                    </p>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="timeline-legend">
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--color-success)' }} />
                  &lt; 30d
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--color-warning)' }} />
                  30–90d
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#FF9500' }} />
                  90–180d
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#FF3B30' }} />
                  &gt; 180d
                </span>
              </div>

              {/* Formula reference */}
              <details className="formula-ref">
                <summary className="formula-ref-summary">How is this calculated?</summary>
                <div className="formula-ref-content">
                  <p><strong>Sample size for binary outcomes (Trial Starts, Purchases):</strong></p>
                  <p className="formula-code">
                    n = (z_&#x03B1;/2 + z_&#x03B2;)² × [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)²
                  </p>
                  <p>where p₁ is your current rate and p₂ = p₁ × (1 + lift).</p>

                  <p><strong>Sample size for revenue (LTV):</strong></p>
                  <p className="formula-code">
                    n = 2 × (z_&#x03B1;/2 + z_&#x03B2;)² × &#x03C3;² / &#x03B4;²
                  </p>
                  <p>where &#x03C3; is estimated as 1.5 × mean revenue (heuristic for subscription apps).</p>

                  <p><strong>Days needed:</strong> samples per variant / (daily paywall views / number of variants).</p>

                  <p><strong>Multiple comparisons:</strong> Alpha is Bonferroni-corrected: 0.05 / {pairwiseComparisons(state.variantCount)} = {bonferroniAlpha(0.05, state.variantCount).toFixed(4)} for {state.variantCount} variants.</p>
                </div>
              </details>
            </div>
          ) : (
            <div className="calc-section">
              <h3 className="calc-section-title">Timeline</h3>
              <p className="results-empty">Enter your metrics to see how long your test will take</p>
            </div>
          )}
        </aside>
      </div>

      {/* Cross-link */}
      <div className="cross-link-card">
        <span>Already running a test?</span>
        <a href="/ab-test-evaluator" className="cross-link">Evaluate your results &rarr;</a>
      </div>
    </div>
  );
}
