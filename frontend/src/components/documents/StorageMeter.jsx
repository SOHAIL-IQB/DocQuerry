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
      <div className="metric-info" style={{ height: '56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px 0' }}>
        <div className="storage-header">
          <span className="metric-label">Storage Usage</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span className="storage-text" style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: 1 }}>
              {usedMB} / {maxMB} MB
            </span>
          </div>
          <div className="progress-bar-container" style={{ margin: 0, width: '100%' }}>
            <div 
              className={`progress-bar-fill ${fillClass}`} 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StorageMeter;
