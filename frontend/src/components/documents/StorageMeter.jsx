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
      <div className="metric-info">
        <div className="storage-header">
          <span className="metric-label">Storage Usage</span>
          <span className="storage-text">{usedMB} MB / {maxMB} MB</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className={`progress-bar-fill ${fillClass}`} 
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>
    </>
  );
};

export default StorageMeter;
