import { useState, useMemo, useRef } from 'react';
import { useEvaluatorState } from './useEvaluatorState';
import { computeAllResults, type VariantResult } from './computeResults';
import { OUTCOME_LABELS, type OutcomeVariable } from './types';
import { formatNumber, pairwiseComparisons, bonferroniAlpha } from '../../utils/abTestStats';
import { parseRevenueCatCSV } from '../../utils/rcCsvParser';
import { isAdaptyCSV, isAdaptySingleTest, parseAdaptySingleCSV, getAdaptyPlacements, parseAdaptyCSV, type AdaptyPlacementInfo } from '../../utils/adaptyCsvParser';
import { confirmReset } from '../../utils/fileHelpers';
import '../AdCalculator/AdCalculator.css';
import './ABTestEvaluator.css';

function verdictColor(verdict: string): string {
  switch (verdict) {
    case 'yes': return 'var(--color-success)';
    case 'not_yet': return 'var(--color-warning)';
    case 'probably_not': return '#FF3B30';
    default: return 'var(--color-text-secondary)';
  }
}

function verdictBg(verdict: string): string {
  switch (verdict) {
    case 'yes': return 'rgba(52, 199, 89, 0.08)';
    case 'not_yet': return 'rgba(255, 149, 0, 0.08)';
    case 'probably_not': return 'rgba(255, 59, 48, 0.08)';
    default: return 'transparent';
  }
}

function verdictLabel(verdict: string, hasLoserHint: boolean): string {
  switch (verdict) {
    case 'yes': return 'Yes — you can pick a winner';
    case 'not_yet': return hasLoserHint ? 'Not yet — but here\'s an idea' : 'Not yet — keep running';
    case 'probably_not': return hasLoserHint ? 'Probably not — but here\'s an idea' : 'Probably not at this scale';
    default: return '';
  }
}

function formatCI(ci: [number, number], variable: OutcomeVariable): string {
  if (variable === 'ltv') {
    return `$${ci[0].toFixed(2)} to $${ci[1].toFixed(2)}`;
  }
  return `${(ci[0] * 100).toFixed(2)}% to ${(ci[1] * 100).toFixed(2)}%`;
}

function formatMultiplier(currentN: number, requiredN: number, daysRunning: number): { badge: string; detail: string } {
  if (currentN <= 0 || !isFinite(requiredN)) return { badge: 'Need much more data', detail: 'Not feasible' };
  const mult = requiredN / currentN;
  const badgeText = `Need ~${mult.toFixed(1)}x more data`;
  if (daysRunning > 0) {
    const daysNeeded = Math.ceil(mult * daysRunning);
    return { badge: badgeText, detail: `~${mult.toFixed(1)}x current (~${daysNeeded} more days at current pace)` };
  }
  return { badge: badgeText, detail: `~${mult.toFixed(1)}x current data (${formatNumber(requiredN)}/variant)` };
}

function formatRate(rate: number, variable: OutcomeVariable): string {
  if (variable === 'ltv') return `$${rate.toFixed(2)}`;
  return `${(rate * 100).toFixed(2)}%`;
}

export default function ABTestEvaluator() {
  const { state, dispatch, copyShareLink } = useEvaluatorState();
  const [copied, setCopied] = useState(false);
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());

  const results = useMemo(() => computeAllResults(state), [state]);
  const activeResult = results.find((r) => r.variable === state.activeResultTab);

  const hasData = state.variants.some((v) => v.usersExposed > 0);

  const handleCopyLink = async () => {
    await copyShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => confirmReset(() => dispatch({ type: 'RESET_ALL' }));

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const placementDialogRef = useRef<HTMLDialogElement>(null);
  const [pendingAdaptyCsv, setPendingAdaptyCsv] = useState<string | null>(null);
  const [adaptyPlacements, setAdaptyPlacements] = useState<AdaptyPlacementInfo[]>([]);
  const [pendingFileName, setPendingFileName] = useState('');

  const applyImport = (result: { variants: any[]; selectedVariables: OutcomeVariable[]; variantCount: number }, fileName: string, warnings?: string[]) => {
    dispatch({
      type: 'IMPORT_RC_CSV',
      variants: result.variants,
      selectedVariables: result.selectedVariables,
      variantCount: result.variantCount,
    });
    let msg = `Imported ${result.variantCount} variants from ${fileName}`;
    if (warnings && warnings.length > 0) {
      msg += `\n⚠ ${warnings.join('\n⚠ ')}`;
    }
    setImportStatus(msg);
    setTimeout(() => setImportStatus(null), 6000);
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const csvText = reader.result as string;

      // Auto-detect format
      if (isAdaptyCSV(csvText)) {
        // Single A/B test format (no placement/variation columns)
        if (isAdaptySingleTest(csvText)) {
          const result = parseAdaptySingleCSV(csvText);
          if (result) {
            applyImport(result, file.name, result.warnings);
          } else {
            setImportStatus('Could not parse Adapty single A/B test CSV. Need at least 2 paywall variants.');
            setTimeout(() => setImportStatus(null), 4000);
          }
          return;
        }

        // Cross A/B test format (has variation + placement columns)
        const placements = getAdaptyPlacements(csvText);
        const withData = placements.filter((p) => p.hasData);

        if (withData.length === 0) {
          setImportStatus('No placements with data found in this Adapty export.');
          setTimeout(() => setImportStatus(null), 4000);
          return;
        }

        if (withData.length === 1) {
          // Only one placement with data — import directly
          const result = parseAdaptyCSV(csvText, withData[0].name);
          if (result) {
            applyImport(result, file.name, result.warnings);
          }
          return;
        }

        // Multiple placements — show picker
        setPendingAdaptyCsv(csvText);
        setAdaptyPlacements(withData);
        setPendingFileName(file.name);
        placementDialogRef.current?.showModal();
        return;
      }

      // Try RevenueCat format
      const result = parseRevenueCatCSV(csvText);
      if (result) {
        applyImport(result, file.name);
      } else {
        setImportStatus('Could not parse CSV. Supports RevenueCat and Adapty experiment exports.');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handlePlacementSelect = (placementName: string) => {
    placementDialogRef.current?.close();
    if (!pendingAdaptyCsv) return;
    const result = parseAdaptyCSV(pendingAdaptyCsv, placementName);
    if (result) {
      applyImport(result, pendingFileName, result.warnings);
    }
    setPendingAdaptyCsv(null);
    setAdaptyPlacements([]);
  };

  const toggleExpand = (id: string) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const revenueInputWidth = useMemo(() => {
    const maxLen = Math.max(
      ...state.variants.map((v) => (v.totalRevenue || 0).toString().length),
      4, // minimum
    );
    return `${maxLen + 2}ch`;
  }, [state.variants]);

  const [dragging, setDragging] = useState(false);

  return (
    <div className="ad-calculator">
      {/* CSV Import */}
      <div className="calc-section import-section">
        <h3 className="calc-section-title">Import Data</h3>
        <p className="import-description">
          Import a CSV export from RevenueCat or Adapty. The format is auto-detected.
        </p>
        <div className="import-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="import-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportCSV(file);
              e.target.value = '';
            }}
          />
          <div
            className={`import-drop-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer?.files[0];
              if (file) handleImportCSV(file);
            }}
          >
            or drop CSV here
          </div>
        </div>
        {importStatus && (
          <p className={`import-status ${importStatus.startsWith('Could not') ? 'error' : 'success'}`}>
            {importStatus}
          </p>
        )}
      </div>

      {/* Adapty placement picker dialog */}
      <dialog ref={placementDialogRef} className="placement-dialog">
        <div className="placement-dialog-content">
          <h3 className="placement-dialog-title">Select a placement to import</h3>
          <p className="placement-dialog-description">
            This Adapty export has multiple placements. Choose one to analyze.
          </p>
          <div className="placement-options">
            {adaptyPlacements.map((p) => (
              <button
                key={p.name}
                className="placement-option"
                onClick={() => handlePlacementSelect(p.name)}
              >
                <span className="placement-option-name">{p.name}</span>
                <span className="placement-option-meta">
                  {p.variations.length} variants
                </span>
              </button>
            ))}
          </div>
          <button
            className="placement-cancel"
            onClick={() => {
              placementDialogRef.current?.close();
              setPendingAdaptyCsv(null);
            }}
          >Cancel</button>
        </div>
      </dialog>

      {/* Controls */}
      <div className="calc-controls">
        <div className="days-running-group">
          <label className="control-label">Days running</label>
          <input
            type="text"
            inputMode="numeric"
            className="calc-input days-input"
            value={state.daysRunning || ''}
            placeholder="0"
            onChange={(e) => dispatch({ type: 'SET_DAYS_RUNNING', days: parseInt(e.target.value) || 0 })}
          />
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

      {/* Two-column layout: inputs left, results right */}
      <div className="eval-layout">
        {/* Left column: inputs */}
        <div className="calc-inputs">
          {/* Variable selector */}
          <div className="calc-section">
            <h3 className="calc-section-title">What are you measuring?</h3>
            <div className="variable-checkboxes">
              {(['trialStarts', 'purchases', 'ltv'] as OutcomeVariable[]).map((v) => (
                <label key={v} className="variable-checkbox">
                  <input
                    type="checkbox"
                    checked={state.selectedVariables.includes(v)}
                    onChange={() => dispatch({ type: 'TOGGLE_VARIABLE', variable: v })}
                  />
                  <span className={`checkbox-dot ${state.selectedVariables.includes(v) ? 'checked' : ''}`} />
                  <span>{OUTCOME_LABELS[v]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Data table */}
          <div className="calc-section">
            <h3 className="calc-section-title">Enter your data</h3>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-name">Variant</th>
                    <th className="col-num">Users</th>
                    {state.selectedVariables.includes('trialStarts') && (
                      <th className="col-num">Trials</th>
                    )}
                    {state.selectedVariables.includes('purchases') && (
                      <th className="col-num">Purchases</th>
                    )}
                    {state.selectedVariables.includes('ltv') && (
                      <th className="col-num col-revenue">Revenue</th>
                    )}
                    <th className="col-action" />
                  </tr>
                </thead>
                <tbody>
                  {state.variants.map((variant) => (
                    <tr key={variant.id} className="data-row">
                      <td className="col-name">
                        <input
                          type="text"
                          className="name-input"
                          value={variant.name}
                          onChange={(e) =>
                            dispatch({ type: 'UPDATE_VARIANT', id: variant.id, field: 'name', value: e.target.value })
                          }
                        />
                      </td>
                      <td className="col-num">
                        <input
                          type="text"
                          inputMode="numeric"
                          className="calc-input"
                          value={variant.usersExposed || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            dispatch({ type: 'UPDATE_VARIANT', id: variant.id, field: 'usersExposed', value: val });
                          }}
                        />
                      </td>
                      {state.selectedVariables.includes('trialStarts') && (
                        <td className="col-num">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="calc-input"
                            value={variant.trialStarts || ''}
                            placeholder="0"
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              dispatch({ type: 'UPDATE_VARIANT', id: variant.id, field: 'trialStarts', value: val });
                            }}
                          />
                          {variant.usersExposed > 0 && variant.trialStarts > 0 && (
                            <span className="cell-rate">{((variant.trialStarts / variant.usersExposed) * 100).toFixed(1)}%</span>
                          )}
                        </td>
                      )}
                      {state.selectedVariables.includes('purchases') && (
                        <td className="col-num">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="calc-input"
                            value={variant.purchases || ''}
                            placeholder="0"
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              dispatch({ type: 'UPDATE_VARIANT', id: variant.id, field: 'purchases', value: val });
                            }}
                          />
                          {variant.usersExposed > 0 && variant.purchases > 0 && (
                            <span className="cell-rate">{((variant.purchases / variant.usersExposed) * 100).toFixed(2)}%</span>
                          )}
                        </td>
                      )}
                      {state.selectedVariables.includes('ltv') && (
                        <td className="col-num col-revenue">
                          <div className="revenue-input-wrap">
                            <span className="calc-row-unit-prefix">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="calc-input"
                              style={{ width: revenueInputWidth }}
                              value={variant.totalRevenue || ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                dispatch({ type: 'UPDATE_VARIANT', id: variant.id, field: 'totalRevenue', value: val });
                              }}
                            />
                          </div>
                          {variant.usersExposed > 0 && variant.totalRevenue > 0 && (
                            <span className="cell-rate">${(variant.totalRevenue / variant.usersExposed).toFixed(2)}/user</span>
                          )}
                        </td>
                      )}
                      <td className="col-action">
                        {state.variants.length > 2 && (
                          <button
                            className="delete-variant-btn"
                            onClick={() => {
                              if (window.confirm(`Remove ${variant.name}?`)) {
                                dispatch({ type: 'DELETE_VARIANT', id: variant.id });
                              }
                            }}
                            title="Remove variant"
                          >×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {state.variants.length < 8 && (
              <button
                className="add-variant-btn"
                onClick={() => dispatch({ type: 'ADD_VARIANT' })}
              >+ Add Variant</button>
            )}
          </div>
        </div>

        {/* Right column: results (sticky sidebar) */}
        <aside className="eval-sidebar">
          {hasData ? (
            <div className="calc-section results-section">
              <h3 className="calc-section-title">Results</h3>

              {/* Variable tabs */}
              {state.selectedVariables.length > 1 && (
                <div className="segmented-control results-tabs">
                  {(['trialStarts', 'purchases', 'ltv'] as OutcomeVariable[]).filter(v => state.selectedVariables.includes(v)).map((v) => (
                    <button
                      key={v}
                      className={`segmented-button ${state.activeResultTab === v ? 'active' : ''}`}
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: v })}
                    >{OUTCOME_LABELS[v]}</button>
                  ))}
                </div>
              )}

              {activeResult && (
                <div className="result-content">
                  {/* Verdict card */}
                  <div
                    className="verdict-card"
                    style={{
                      borderColor: verdictColor(activeResult.verdict.verdict),
                      background: verdictBg(activeResult.verdict.verdict),
                    }}
                  >
                    <div className="verdict-title" style={{ color: verdictColor(activeResult.verdict.verdict) }}>
                      Can you pick a winner?
                    </div>
                    <div className="verdict-answer" style={{ color: verdictColor(activeResult.verdict.verdict) }}>
                      {verdictLabel(activeResult.verdict.verdict, activeResult.verdict.explanation.includes('{{LOSER_HINT}}'))}
                    </div>
                    <p className="verdict-explanation">
                      {activeResult.verdict.explanation.split('\n{{LOSER_HINT}}')[0]}
                      {activeResult.verdict.verdict !== 'yes' && state.daysRunning > 0 && isFinite(activeResult.verdict.multiplier) && (
                        <> That's roughly {Math.ceil(activeResult.verdict.multiplier * state.daysRunning)} more days at your current pace.</>
                      )}
                    </p>
                    {activeResult.verdict.explanation.includes('{{LOSER_HINT}}') && (
                      <p className="verdict-hint">Consider removing the losing variants marked significant below to speed things up.</p>
                    )}
                  </div>

                  {/* Baseline selector — only for frequentist (non-Bayesian) */}
                  {!activeResult.isBayesian && (
                  <div className="baseline-row">
                    <span className="baseline-label">Comparing against:</span>
                    <select
                      className="baseline-select"
                      value={state.baselineVariantId ?? ''}
                      onChange={(e) => dispatch({ type: 'SET_BASELINE', id: e.target.value || null })}
                    >
                      <option value="">First variant (default)</option>
                      {state.variants.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  )}

                  {/* Bayesian LTV results */}
                  {activeResult.isBayesian && activeResult.bayesian && (
                    <div className="variant-breakdowns">
                      {[...activeResult.bayesian]
                        .sort((a, b) => b.revenuePer1K - a.revenuePer1K)
                        .map((bv) => (
                        <div key={bv.variantId} className="variant-breakdown">
                          <button
                            className="variant-breakdown-header"
                            onClick={() => toggleExpand(bv.variantId)}
                          >
                            <div className="vb-left">
                              <span className="vb-name">{bv.variantName}</span>
                              <span className="vb-rate-inline">${bv.revenuePer1K.toFixed(1)}/1K</span>
                            </div>
                            <div className="vb-right">
                              <span className="vb-ci-badge">
                                ${bv.credibleInterval[0].toFixed(0)}–${bv.credibleInterval[1].toFixed(0)}
                              </span>
                              <span className={`vb-chevron ${expandedVariants.has(bv.variantId) ? 'expanded' : ''}`}>
                                &#9662;
                              </span>
                            </div>
                          </button>
                          {expandedVariants.has(bv.variantId) && (
                            <div className="vb-details">
                              <div className="vb-detail-row">
                                <span className="vb-detail-label">Revenue per 1K users</span>
                                <span className="vb-detail-value">${bv.revenuePer1K.toFixed(2)}</span>
                              </div>
                              <div className="vb-detail-row">
                                <span className="vb-detail-label">95% credible interval (per 1K)</span>
                                <span className="vb-detail-value">${bv.credibleInterval[0].toFixed(2)} – ${bv.credibleInterval[1].toFixed(2)}</span>
                              </div>
                              <div className="vb-detail-row">
                                <span className="vb-detail-label">Probability to be best (P2BB)</span>
                                <span className="vb-detail-value">{(bv.p2bb * 100).toFixed(1)}%</span>
                              </div>
                              <div className="vb-detail-row">
                                <span className="vb-detail-label">Revenue per user</span>
                                <span className="vb-detail-value">${bv.posteriorMean.toFixed(4)}</span>
                              </div>
                              <div className="vb-detail-row">
                                <span className="vb-detail-label">Users</span>
                                <span className="vb-detail-value">{state.variants.find(v => v.id === bv.variantId)?.usersExposed.toLocaleString()}</span>
                              </div>
                              <div className="vb-detail-row">
                                <span className="vb-detail-label">Purchases</span>
                                <span className="vb-detail-value">{state.variants.find(v => v.id === bv.variantId)?.purchases}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Frequentist per-variant breakdown */}
                  {!activeResult.isBayesian && (
                  <div className="variant-breakdowns">
                    {/* Baseline variant at top */}
                    {(() => {
                      const baselineVariant = state.variants.find((v) => v.id === activeResult.baselineId);
                      if (!baselineVariant) return null;
                      const rate = baselineVariant.usersExposed > 0
                        ? (state.activeResultTab === 'ltv'
                            ? baselineVariant.totalRevenue / baselineVariant.usersExposed
                            : (state.activeResultTab === 'trialStarts' ? baselineVariant.trialStarts : baselineVariant.purchases) / baselineVariant.usersExposed)
                        : 0;
                      return (
                        <div className="variant-breakdown baseline-variant">
                          <div className="variant-breakdown-header baseline-header">
                            <div className="vb-left">
                              <span className="vb-name">{baselineVariant.name}</span>
                              <span className="vb-rate-inline">{formatRate(rate, state.activeResultTab)}</span>
                            </div>
                            <span className="vb-badge baseline-badge">Baseline</span>
                          </div>
                        </div>
                      );
                    })()}

                    {activeResult.variantResults.map((vr: VariantResult) => (
                      <div key={vr.variantId} className="variant-breakdown">
                        <button
                          className="variant-breakdown-header"
                          onClick={() => toggleExpand(vr.variantId)}
                        >
                          <div className="vb-left">
                            <span className="vb-name">{vr.variantName}</span>
                            <span
                              className={`vb-lift ${vr.liftPercent > 0 ? 'positive' : vr.liftPercent < 0 ? 'negative' : ''}`}
                            >
                              {vr.liftPercent > 0 ? '+' : ''}{vr.liftPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="vb-right">
                            {vr.isSignificant ? (
                              <span className="vb-badge significant">Significant</span>
                            ) : (
                              <span className="vb-badge not-significant">
                                {formatMultiplier(
                                  state.variants.find(v => v.id === vr.variantId)?.usersExposed ?? 0,
                                  vr.samplesNeededToConfirm,
                                  state.daysRunning,
                                ).badge}
                              </span>
                            )}
                            <span className={`vb-chevron ${expandedVariants.has(vr.variantId) ? 'expanded' : ''}`}>
                              &#9662;
                            </span>
                          </div>
                        </button>

                        {expandedVariants.has(vr.variantId) && (
                          <div className="vb-details">
                            <div className="vb-detail-row">
                              <span className="vb-detail-label">
                                {state.activeResultTab === 'ltv' ? 'Avg Revenue' : 'Rate'}
                              </span>
                              <span className="vb-detail-value">{formatRate(vr.rate, state.activeResultTab)}</span>
                            </div>
                            <div className="vb-detail-row">
                              <span className="vb-detail-label">Lift vs baseline</span>
                              <span className={`vb-detail-value ${vr.liftPercent > 0 ? 'positive' : vr.liftPercent < 0 ? 'negative' : ''}`}>
                                {vr.liftPercent > 0 ? '+' : ''}{vr.liftPercent.toFixed(2)}%
                              </span>
                            </div>
                            <div className="vb-detail-row">
                              <span className="vb-detail-label">CI (difference)</span>
                              <span className="vb-detail-value">{formatCI(vr.confidenceInterval, state.activeResultTab)}</span>
                            </div>
                            <div className="vb-detail-row">
                              <span className="vb-detail-label">p-value</span>
                              <span className="vb-detail-value">{vr.pValue.toFixed(4)}</span>
                            </div>
                            <div className="vb-detail-row">
                              <span className="vb-detail-label">Data needed to confirm</span>
                              <span className="vb-detail-value">
                                {formatMultiplier(
                                  state.variants.find(v => v.id === vr.variantId)?.usersExposed ?? 0,
                                  vr.samplesNeededToConfirm,
                                  state.daysRunning,
                                ).detail}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}

              {/* Formula reference — shows only for active tab */}
              {activeResult && (
              <details className="formula-ref">
                <summary className="formula-ref-summary">How is this calculated?</summary>
                <div className="formula-ref-content">
                  {state.activeResultTab !== 'ltv' ? (
                    <>
                      <p><strong>Test:</strong> Two-proportion z-test</p>
                      <p className="formula-code">
                        z = (p₂ - p₁) / √[p&#x0302;(1-p&#x0302;)(1/n₁ + 1/n₂)]
                      </p>
                      {(() => {
                        const bv = state.variants.find((v) => v.id === activeResult.baselineId);
                        const firstOther = activeResult.variantResults[0];
                        if (!bv || !firstOther) return null;
                        const p1 = firstOther ? (state.activeResultTab === 'trialStarts'
                          ? bv.trialStarts / bv.usersExposed
                          : bv.purchases / bv.usersExposed) : 0;
                        return (
                          <p>Baseline rate (p₁) = {(p1 * 100).toFixed(2)}%, n₁ = {bv.usersExposed.toLocaleString()}</p>
                        );
                      })()}
                      <p><strong>Sample size estimation:</strong></p>
                      <p className="formula-code">
                        n = (z_&#x03B1;/2 + z_&#x03B2;)² × [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)²
                      </p>
                      <p>&#x03B1; = {state.variants.length > 2
                        ? `${(bonferroniAlpha(0.05, state.variants.length)).toFixed(4)} (0.05 Bonferroni-corrected for ${pairwiseComparisons(state.variants.length)} comparisons)`
                        : '0.05 (95% confidence)'
                      }, power = 0.8</p>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const v0 = state.variants[0];
                        if (!v0 || v0.usersExposed === 0) return null;
                        const purchaseRate = (v0.purchases / v0.usersExposed * 100).toFixed(2);
                        const revPerUser = (v0.totalRevenue / v0.usersExposed).toFixed(4);
                        return (
                          <>
                            <p><strong>Bayesian two-part model</strong> (<a href="https://adapty.io/docs/maths-behind-it" target="_blank" rel="noopener noreferrer" style={{color: 'var(--color-blue)'}}>same methodology as Adapty</a>)</p>

                            <p><strong>Step 1 — Purchase rate:</strong> Of {v0.usersExposed.toLocaleString()} users, {v0.purchases} purchased ({purchaseRate}%). We model this with a Beta distribution: Beta({v0.purchases + 1}, {v0.usersExposed - v0.purchases + 1}). This captures our uncertainty — with only {v0.purchases} purchases, the true rate could plausibly be higher or lower.</p>

                            <p><strong>Step 2 — Revenue per payer:</strong> Among the {v0.purchases} who paid, we know the price of each product they bought. We model this with a Log-normal distribution fitted to the per-product prices.</p>

                            <p><strong>Step 3 — Combine via simulation:</strong> We draw 20,000 random samples. Each sample: draw a purchase rate from Step 1, draw a revenue-per-payer from Step 2, multiply them. This gives 20,000 plausible values for revenue per user (${v0.name}: ~${revPerUser}/user).</p>

                            <p><strong>Credible interval:</strong> Sort the 20,000 samples, take the 2.5th and 97.5th percentiles. This is the range where the true revenue per 1K users most likely falls.</p>

                            <p><strong>Can we pick a winner?</strong> If the best variant's lower CI bound is above the second-best's upper CI bound, the intervals don't overlap — we can be confident. If they overlap, we estimate how much more data is needed based on how quickly CIs narrow (they shrink proportional to 1/√N).</p>

                            <p><strong>P2BB</strong> (shown in detail): the fraction of 20,000 samples where a variant has the highest revenue. Useful but volatile with small data — the CI overlap test is more stable.</p>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </details>
              )}
            </div>
          ) : (
            <div className="calc-section results-section">
              <h3 className="calc-section-title">Results</h3>
              <p className="results-empty">Enter your data to see results</p>
            </div>
          )}
        </aside>
      </div>

      {/* Cross-link */}
      <div className="cross-link-card">
        <span>Planning a new test?</span>
        <a href="/ab-test-planner" className="cross-link">Use the A/B Test Planner &rarr;</a>
      </div>
    </div>
  );
}
