import { useState } from 'react';
import './Folder.css';

const darkenColor = (hex, percent) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const Folder = ({ color = '#5227FF', size = 1, className = '', onClick }) => {
  const [open, setOpen] = useState(false);

  const folderBackColor = darkenColor(color, 0.08);

  const handleClick = (e) => {
    setOpen(prev => !prev);
    if (onClick) {
      onClick(e);
    }
  };

  const folderStyle = {
    '--folder-color': color,
    '--folder-back-color': folderBackColor
  };

  const folderClassName = `folder ${open ? 'open' : ''}`.trim();
  const scaleStyle = { transform: `scale(${size})` };

  return (
    <div style={scaleStyle} className={className}>
      <div className={folderClassName} style={folderStyle} onClick={handleClick}>
        <div className="folder__back">
          {/* Decorative papers to give the folder some life before opening */}
          <div className="paper paper-1" style={{ width: '80%', height: '80%', background: 'rgba(255,255,255,0.1)' }}></div>
          <div className="paper paper-2" style={{ width: '70%', height: '70%', background: 'rgba(255,255,255,0.2)' }}></div>
          <div className="folder__front"></div>
          <div className="folder__front right"></div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
