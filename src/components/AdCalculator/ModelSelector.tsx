import type { AdModel } from './types';

interface Props {
  model: AdModel;
  onChange: (model: AdModel) => void;
}

export function ModelSelector({ model, onChange }: Props) {
  return (
    <div className="model-selector">
      <label className="control-label">Ad Platform</label>
      <div className="segmented-control">
        <button
          type="button"
          className={`segmented-button ${model === 'cpt' ? 'active' : ''}`}
          onClick={() => onChange('cpt')}
        >
          CPT (Apple Search Ads)
        </button>
        <button
          type="button"
          className={`segmented-button ${model === 'cpm' ? 'active' : ''}`}
          onClick={() => onChange('cpm')}
        >
          CPM (Meta)
        </button>
      </div>
    </div>
  );
}
