import { useState } from 'react';
import { useCalculatorState } from './useCalculatorState';
import { ModelSelector } from './ModelSelector';
import { CalculatorRow } from './CalculatorRow';
import { RoasDisplay } from './RoasDisplay';
import type { FieldConfig, MonetizationMode } from './types';
import './AdCalculator.css';

const AD_COST_FIELDS: FieldConfig[] = [
  { field: 'cpm', label: 'CPM', unit: '$', cpmOnly: true, description: 'What you pay per 1,000 ad impressions on Meta/Facebook.' },
  { field: 'tapThroughRate', label: 'Tap-Through Rate', unit: '%', cpmOnly: true, description: 'Of people who see your ad, the percentage who tap on it.' },
  { field: 'cpt', label: 'Cost Per Tap', unit: '$', derivedFrom: 'CPM / (1000 × TTR)', description: 'How much each tap on your ad costs you.' },
  { field: 'conversionRate', label: 'Conversion Rate', unit: '%', description: 'Of people who tap your ad, how many actually install your app.' },
  { field: 'cpa', label: 'Cost Per Install', unit: '$', derivedFrom: 'CPT / Conv Rate', description: 'Your all-in cost to acquire one app install.' },
];

const MONETIZATION_FIELDS: FieldConfig[] = [
  { field: 'trialStartRate', label: 'Trial Start Rate', unit: '%', trialsOnly: true, description: 'Of all installs, how many start a free trial.' },
  { field: 'trialConversionRate', label: 'Trial Conversion Rate', unit: '%', trialsOnly: true, description: 'Of people who start a trial, how many become paying subscribers.' },
  { field: 'installToPayingRate', label: 'Install to Paying', unit: '%', description: 'Of all installs, how many become paying subscribers.' },
  { field: 'costPerTrialStart', label: 'Cost Per Trial Start', unit: '$', derivedFrom: 'CPA / Trial Rate', trialsOnly: true, description: 'How much you spend in ads to get one trial signup.' },
  { field: 'costPerSubscriber', label: 'Cost Per Subscriber', unit: '$', derivedFrom: 'CPA / Paying Rate', description: 'How much you spend in ads to get one paying subscriber.' },
];

const ORGANIC_UPLIFT_FIELDS: FieldConfig[] = [
  { field: 'kFactor', label: 'K-Factor', unit: '×',
    description: 'Organic installs generated per paid install. 0.3 means every 10 paid installs drive ~3 additional organic installs.' },
];

const REVENUE_FIELDS: FieldConfig[] = [
  { field: 'revenuePerSubscriber', label: 'Revenue Per Subscriber', unit: '$', description: 'Total revenue you expect from one paying subscriber over their lifetime (LTV). For many subscription apps, the price of an annual subscription is a decent rough estimate.' },
  { field: 'revenuePerInstall', label: 'Revenue Per Install', unit: '$', derivedFrom: 'Rev/Sub × Paying Rate', description: 'Average revenue per install, accounting for the percentage who actually pay.' },
];

function getInstallToPayingDescription(mode: MonetizationMode): string {
  if (mode === 'mixed') {
    return 'Blended rate across all install sources. This is your aggregate conversion from install to paying subscriber.';
  }
  return 'Of all installs, how many become paying subscribers.';
}

function getInstallToPayingDerivedFrom(mode: MonetizationMode): string | undefined {
  if (mode === 'trials') return 'Trial Start × Trial Conv';
  return undefined;
}

export default function AdCalculator() {
  const { state, setModel, setMonetizationMode, setField, toggleLock, resetAll, copyShareLink } = useCalculatorState();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await copyShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderField = (f: FieldConfig) => {
    // cpmOnly visibility
    if (f.cpmOnly && state.model !== 'cpm') return null;
    // trialsOnly visibility
    if (f.trialsOnly && state.monetizationMode !== 'trials') return null;

    // In CPT model, CPT is a direct input (not derived)
    let derivedFrom = f.field === 'cpt' && state.model === 'cpt' ? undefined : f.derivedFrom;
    let description = f.description;

    // installToPayingRate: adjust description and derivedFrom by mode
    if (f.field === 'installToPayingRate') {
      description = getInstallToPayingDescription(state.monetizationMode);
      derivedFrom = getInstallToPayingDerivedFrom(state.monetizationMode);
    }

    const isLocked = !!state.locked[f.field];

    return (
      <CalculatorRow
        key={f.field}
        label={f.label}
        field={f.field}
        value={state[f.field] as number}
        unit={f.unit}
        onChange={setField}
        onToggleLock={toggleLock}
        isLocked={isLocked}
        derivedFrom={derivedFrom}
        description={description}
        visible={true}
      />
    );
  };

  return (
    <div className="ad-calculator">
      <div className="calc-controls">
        <ModelSelector model={state.model} onChange={setModel} />
        <div className="calc-controls-right">
          <button type="button" className="calc-share-btn" onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button type="button" className="calc-reset-btn" onClick={resetAll}>
            Reset All
          </button>
        </div>
      </div>

      <div className="calc-layout">
        <div className="calc-inputs">
          <div className="calc-section">
            <h3 className="calc-section-title">Ad Costs</h3>
            {AD_COST_FIELDS.map(renderField)}
          </div>

          <div className="calc-section">
            <h3 className="calc-section-title">Monetization</h3>
            <div className="model-selector" style={{ marginBottom: '16px' }}>
              <label className="control-label">Revenue Model</label>
              <div className="segmented-control">
                <button
                  className={`segmented-button ${state.monetizationMode === 'trials' ? 'active' : ''}`}
                  onClick={() => setMonetizationMode('trials')}
                >Free Trial</button>
                <button
                  className={`segmented-button ${state.monetizationMode === 'noTrials' ? 'active' : ''}`}
                  onClick={() => setMonetizationMode('noTrials')}
                >Direct Purchase</button>
                <button
                  className={`segmented-button ${state.monetizationMode === 'mixed' ? 'active' : ''}`}
                  onClick={() => setMonetizationMode('mixed')}
                >Mixed</button>
              </div>
            </div>
            {MONETIZATION_FIELDS.map(renderField)}
          </div>

          <div className="calc-section">
            <h3 className="calc-section-title">Organic Uplift</h3>
            {ORGANIC_UPLIFT_FIELDS.map(renderField)}
          </div>

          <div className="calc-section">
            <h3 className="calc-section-title">Revenue</h3>
            {REVENUE_FIELDS.map(renderField)}
          </div>
        </div>

        <aside className="calc-sidebar">
          <RoasDisplay
            roas={state.roas}
            adjustedRoas={state.adjustedRoas}
            cpa={state.cpa}
            revenuePerInstall={state.revenuePerInstall}
            kFactor={state.kFactor}
            installToPayingRate={state.installToPayingRate}
            costPerTrialStart={state.costPerTrialStart}
            costPerSubscriber={state.costPerSubscriber}
            revenuePerSubscriber={state.revenuePerSubscriber}
            trialConversionRate={state.trialConversionRate}
            monetizationMode={state.monetizationMode}
          />
        </aside>
      </div>
    </div>
  );
}
