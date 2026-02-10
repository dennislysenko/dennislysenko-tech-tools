import { useState } from 'react';
import type { AdModel, MonetizationMode } from './types';

type ViewMode = 'install' | 'trial' | 'subscriber';

interface Props {
  roas: number;
  adjustedRoas: number;
  model: AdModel;
  cpa: number;
  conversionRate: number;
  revenuePerInstall: number;
  kFactor: number;
  installToPayingRate: number;
  costPerTrialStart: number;
  costPerSubscriber: number;
  revenuePerSubscriber: number;
  trialConversionRate: number;
  monetizationMode: MonetizationMode;
}

// ROAS uses 0x = breakeven. Negative = loss, positive = profit.
function getRoasColor(roas: number): string {
  if (roas < -0.2) return '#FF3B30';
  if (roas < 0) return '#FF9500';
  if (roas < 0.2) return '#FFCC00';
  return '#34C759';
}

function getRoasLabel(roas: number): string {
  if (roas < -0.5) return 'Below breakeven';
  if (roas < -0.2) return 'Below breakeven';
  if (roas < 0) return 'Near breakeven';
  if (roas < 0.0001) return 'Breakeven';
  if (roas < 0.2) return 'Slightly profitable';
  if (roas < 1.0) return 'Profitable';
  return 'Highly profitable';
}

function getRoasBg(roas: number): string {
  if (roas < -0.2) return 'rgba(255, 59, 48, 0.06)';
  if (roas < 0) return 'rgba(255, 149, 0, 0.06)';
  if (roas < 0.2) return 'rgba(255, 204, 0, 0.06)';
  return 'rgba(52, 199, 89, 0.06)';
}

function formatRoas(roas: number): string {
  const sign = roas > 0 ? '+' : '';
  return `${sign}${roas.toFixed(2)}x`;
}

interface Lever {
  title: string;
  description: string;
}

function getBreakevenLevers(props: Props): Lever[] {
  const levers: Lever[] = [];

  if (props.model === 'cpm') {
    levers.push({
      title: 'Improve conversion rate',
      description: 'Better ad creative and audience targeting — reduces CPA linearly.',
    });
  } else {
    levers.push({
      title: 'Improve conversion rate',
      description: 'Optimize App Store screenshots, preview video, and description — reduces CPA linearly.',
    });
  }

  levers.push({
    title: 'Increase install-to-paying rate',
    description: 'Improve onboarding, paywall placement, and trial experience — increases revenue per install linearly.',
  });

  levers.push({
    title: 'Increase subscriber LTV',
    description: 'Retention offers, annual plans, and upsells — increases revenue per install linearly.',
  });

  if (props.kFactor === 0) {
    levers.push({
      title: 'Factor in organic uplift',
      description: 'Paid installs often drive organic growth — set a K-factor above to model this.',
    });
  }

  return levers;
}

function getSpendEarn(
  view: ViewMode,
  props: Props,
): { spend: number; earn: number; perLabel: string } {
  const k = 1 + props.kFactor;
  switch (view) {
    case 'trial':
      return {
        spend: props.costPerTrialStart,
        earn: props.revenuePerSubscriber * props.trialConversionRate * k,
        perLabel: 'per trial',
      };
    case 'subscriber':
      return {
        spend: props.costPerSubscriber,
        earn: props.revenuePerSubscriber * k,
        perLabel: 'per subscriber',
      };
    default:
      return {
        spend: props.cpa,
        earn: props.revenuePerInstall * k,
        perLabel: 'per install',
      };
  }
}

export function RoasDisplay(props: Props) {
  const { roas, adjustedRoas, cpa, monetizationMode } = props;
  const [viewMode, setViewMode] = useState<ViewMode>('install');

  const displayRoas = adjustedRoas > roas ? adjustedRoas : roas;
  const hasOrganic = adjustedRoas > roas;
  const hasData = cpa > 0;
  const showTrials = monetizationMode === 'trials';

  const color = getRoasColor(displayRoas);
  const label = getRoasLabel(displayRoas);
  const bg = getRoasBg(displayRoas);
  const percentage = displayRoas * 100;

  // Breakeven: how much you need to earn per unit to break even (= spend per unit)

  // Bar: map ROAS to 0-100% where -1x=0%, 0x=50% (breakeven), +1x+=100%
  const barPercent = Math.max(0, Math.min(100, ((displayRoas + 1) / 2) * 100));

  // If trials mode is off and user had "trial" selected, fall back to install
  const effectiveView = (!showTrials && viewMode === 'trial') ? 'install' : viewMode;
  const { spend, earn, perLabel } = getSpendEarn(effectiveView, props);

  return (
    <div className="roas-card" style={{ background: hasData ? bg : undefined, borderColor: hasData ? color : undefined }}>
      <div className="roas-header">
        <span className="roas-title">Return on Ad Spend</span>
      </div>

      {hasData ? (
        <>
          <div className="roas-primary">
            <div className="roas-value" style={{ color }}>
              {formatRoas(displayRoas)}
            </div>
            <div className="roas-percentage" style={{ color }}>
              {percentage >= 0 ? '+' : ''}{percentage.toFixed(0)}% return
            </div>
            {hasOrganic && (
              <div className="roas-organic-detail">
                {formatRoas(roas)} direct · {formatRoas(adjustedRoas)} with organic
              </div>
            )}
          </div>

          <div className="roas-spend-earn">
            <div className="roas-view-selector">
              <button
                className={`roas-view-btn ${effectiveView === 'install' ? 'active' : ''}`}
                onClick={() => setViewMode('install')}
              >Per Install</button>
              {showTrials && (
                <button
                  className={`roas-view-btn ${effectiveView === 'trial' ? 'active' : ''}`}
                  onClick={() => setViewMode('trial')}
                >Per Trial</button>
              )}
              <button
                className={`roas-view-btn ${effectiveView === 'subscriber' ? 'active' : ''}`}
                onClick={() => setViewMode('subscriber')}
              >Per Subscriber</button>
            </div>
            <div className="roas-spend-row">
              <span className="roas-spend-label">You spend</span>
              <span className="roas-spend-value roas-spend-negative">${spend.toFixed(2)}</span>
              <span className="roas-spend-per">{perLabel}</span>
            </div>
            <div className="roas-spend-row">
              <span className="roas-spend-label">You earn</span>
              <span className="roas-spend-value roas-spend-positive">${earn.toFixed(2)}</span>
              <span className="roas-spend-per">{perLabel}</span>
            </div>
          </div>

          <div className="roas-details">
            <div className="roas-bar-container">
              <div className="roas-bar-track">
                <div
                  className="roas-bar-fill"
                  style={{ width: `${barPercent}%`, background: color }}
                />
                <div className="roas-bar-breakeven" />
              </div>
              <div className="roas-bar-labels">
                <span>-1x</span>
                <span>0x breakeven</span>
                <span>+1x+</span>
              </div>
            </div>

            <div className="roas-label">{label}</div>

            {displayRoas < 0 && spend > 0 && (
              <div className="roas-breakeven-hint">
                <div className="roas-breakeven-title">To break even, try:</div>
                <ul className="roas-levers">
                  {getBreakevenLevers(props).map((lever) => (
                    <li key={lever.title} className="roas-lever">
                      <strong className="roas-lever-title">{lever.title}</strong>
                      <span className="roas-lever-desc">{lever.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="roas-empty">Enter your metrics above</div>
      )}
    </div>
  );
}
