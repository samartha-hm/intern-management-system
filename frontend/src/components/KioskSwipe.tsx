import React, { useState, useRef } from 'react';
import CheckInQrKiosk from '../pages/CheckInQrKiosk';
import CheckOutQrKiosk from '../pages/CheckOutQrKiosk';
import { SwapOutlined } from '@ant-design/icons';

const KioskSwipe: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (diffX > 50) {
      setActiveTab(1);
    } else if (diffX < -50) {
      setActiveTab(0);
    }
    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: activeTab === 0 ? '#f0fdf4' : '#fef2f2',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setActiveTab(0)}
          style={{
            border: 'none',
            background: activeTab === 0 ? '#16a34a' : 'rgba(0,0,0,0.1)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 20,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          🟢 ENTRANCE
        </button>
        <SwapOutlined style={{ color: '#64748b', fontSize: 16 }} />
        <button
          onClick={() => setActiveTab(1)}
          style={{
            border: 'none',
            background: activeTab === 1 ? '#dc2626' : 'rgba(0,0,0,0.1)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 20,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          🔴 EXIT
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          width: '200vw',
          height: '100vh',
          transform: `translateX(-${activeTab * 100}vw)`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ width: '100vw', height: '100vh' }}>
          <CheckInQrKiosk hideExtraUI={true} />
        </div>
        <div style={{ width: '100vw', height: '100vh' }}>
          <CheckOutQrKiosk hideExtraUI={true} />
        </div>
      </div>
    </div>
  );
};

export default KioskSwipe;