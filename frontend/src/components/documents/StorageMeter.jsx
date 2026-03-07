import React from 'react';
import { HardDrive } from 'lucide-react';

const StorageMeter = ({ totalUsedBytes, maxBytes = 50 * 1024 * 1024 }) => {
  const percent = Math.min((totalUsedBytes / maxBytes) * 100, 100);
  const usedMB = (totalUsedBytes / (1024 * 1024)).toFixed(2);
  const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
  const isDanger = percent >= 95;
  const isWarning = percent >= 80 && percent < 95;

  let fillClass = 'normal';
  if (isDanger) fillClass = 'danger';
  else if (isWarning) fillClass = 'warning';

  return (
    <>
      <div className="metric-icon orange">
        <HardDrive size={24} />
      </div>
      <div className="metric-info" style={{ height: '56px', justifyContent: 'center', gap: '8px' }}>
        <div className="storage-header" style={{ marginBottom: 'auto', paddingTop: '4px' }}>
          <span className="metric-label">Storage Usage</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '4px' }}>
          <div className="progress-bar-container" style={{ margin: 0, flex: 1 }}>
            <div 
              className={`progress-bar-fill ${fillClass}`} 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <span className="storage-text" style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            {usedMB} / {maxMB} MB
          </span>
        </div>
      </div>
    </>
  );
};

export default StorageMeter;
