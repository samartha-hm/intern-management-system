import React, { useState, useRef } from 'react';
import CheckInQrKiosk from '../pages/CheckInQrKiosk';
import CheckOutQrKiosk from '../pages/CheckOutQrKiosk';
import { SwapOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';

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
      setActiveTab(1); // Swipe left -> Exit (1)
    } else if (diffX < -50) {
      setActiveTab(0); // Swipe right -> Entrance (0)
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
        background: '#011713',
      }}
    >
      {/* Top Floating Glass Navigation Pills */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          padding: '8px 16px',
          borderRadius: 30,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <button
          onClick={() => setActiveTab(0)}
          style={{
            border: 'none',
            background: activeTab === 0 ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
            color: activeTab === 0 ? '#ffffff' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: 22,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 0 ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <LoginOutlined style={{ fontSize: 14 }} />
          <span>ENTRANCE</span>
        </button>

        <SwapOutlined style={{ color: '#64748b', fontSize: 16 }} />

        <button
          onClick={() => setActiveTab(1)}
          style={{
            border: 'none',
            background: activeTab === 1 ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' : 'transparent',
            color: activeTab === 1 ? '#ffffff' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: 22,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 1 ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <LogoutOutlined style={{ fontSize: 14 }} />
          <span>EXIT</span>
        </button>
      </div>

      {/* Swipeable View Slider Container */}
      <div
        style={{
          display: 'flex',
          width: '200vw',
          height: '100vh',
          transform: `translateX(-${activeTab * 100}vw)`,
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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