import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, QRCode, Button } from 'antd';
import { SafetyCertificateOutlined, LogoutOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface CheckOutQrKioskProps {
  hideExtraUI?: boolean;
  forcedLayout?: 'auto' | 'landscape' | 'portrait';
}

const CheckOutQrKiosk: React.FC<CheckOutQrKioskProps> = ({
  hideExtraUI = false,
  forcedLayout = 'auto',
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isKioskUser = currentUser?.role === 'KIOSK' || currentUser?.email?.toLowerCase() === 'kiosk@experimindlabs.com';
    if (!isAuthenticated || !isKioskUser) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, currentUser?.role, currentUser?.email, navigate]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [serverNonce, setServerNonce] = useState<string>('');
  const [nonceDate, setNonceDate] = useState<string>('');
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const fetchServerNonce = async () => {
    try {
      const res = await apiService.get('/attendance/qr-nonce?kind=EXIT');
      if (res && res.nonce) {
        setServerNonce(res.nonce);
        setNonceDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Failed to fetch Exit QR nonce', err);
    }
  };

  useEffect(() => {
    fetchServerNonce();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (todayStr !== nonceDate) {
      fetchServerNonce();
    }
  }, [nonceDate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const isLandscapeMode =
    forcedLayout === 'landscape' || (forcedLayout === 'auto' && screenWidth >= 600);

  const todayStr = currentTime.toISOString().split('T')[0];
  const checkOutPayload = JSON.stringify({
    type: 'CHECK_OUT',
    office: 'EXPERIMIND_LABS_HQ',
    nonce: serverNonce || `EXIT-${todayStr}-DAILY-STABLE`,
    date: todayStr,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        padding: '60px 16px 20px 16px',
        background: 'radial-gradient(circle at 50% 20%, #881337 0%, #450a0a 60%, #200404 100%)',
        color: '#fff',
        boxSizing: 'border-box',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      {/* Background Neon Aura Effect */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Info */}
      <div style={{ textAlign: 'center', zIndex: 2, marginBottom: 14 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', padding: '5px 16px', borderRadius: 30, marginBottom: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
          <span style={{ color: '#fca5a5', fontWeight: 800, fontSize: 12, letterSpacing: 1.2 }}>LIVE DISPLAY</span>
        </div>
        <Title level={2} style={{ margin: 0, color: '#ffffff', fontWeight: 900, fontSize: isLandscapeMode ? 24 : 26, letterSpacing: -0.5 }}>
          Experimind Labs Workplace Exit
        </Title>
        <Text style={{ color: '#94a3b8', fontSize: 14, display: 'block', marginTop: 2 }}>
          Scan this QR code with your smartphone camera to Clock-Out & submit Work Diary
        </Text>
      </div>

      {/* Main Glassmorphic Display Card (Responsive Flex Wrap for Tablet Landscape & Portrait) */}
      <Card
        styles={{
          body: {
            padding: isLandscapeMode ? '24px 32px' : '24px 28px',
            display: 'flex',
            flexDirection: isLandscapeMode ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isLandscapeMode ? 36 : 20,
          },
        }}
        style={{
          width: '92%',
          maxWidth: isLandscapeMode ? 880 : 460,
          borderRadius: 28,
          background: 'rgba(136, 19, 55, 0.45)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(248, 113, 113, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(239, 68, 68, 0.25)',
          zIndex: 2,
        }}
      >
        {/* Left Side: QR Display Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <LogoutOutlined style={{ fontSize: 18, color: '#f87171' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff1f2', letterSpacing: 0.5 }}>EVENING CHECK-OUT</span>
          </div>

          <div
            style={{
              padding: 20,
              background: '#ffffff',
              borderRadius: 24,
              boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
              border: '5px solid #ef4444',
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Increased QR Code Size to 275px */}
            <QRCode value={checkOutPayload} size={isLandscapeMode ? 260 : 275} color="#450a0a" icon="/icon-192.png" />
          </div>

          <Tag
            color="error"
            style={{
              fontSize: 11,
              padding: '4px 12px',
              borderRadius: 20,
              fontWeight: 700,
              border: 'none',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
            }}
          >
            ⚡ Security Nonce Active ({todayStr})
          </Tag>
        </div>

        {/* Right Side: Digital Clock & Date */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderTop: isLandscapeMode ? 'none' : '1px solid rgba(255,255,255,0.1)',
            borderLeft: isLandscapeMode ? '1px solid rgba(255,255,255,0.15)' : 'none',
            paddingTop: isLandscapeMode ? 0 : 16,
            paddingLeft: isLandscapeMode ? 32 : 0,
          }}
        >
          <div style={{ fontSize: isLandscapeMode ? 46 : 40, fontWeight: 900, color: '#f87171', fontFamily: 'monospace', letterSpacing: 1.5, textShadow: '0 0 15px rgba(248,113,113,0.4)' }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: 15, color: '#cbd5e1', marginTop: 4, fontWeight: 600 }}>
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <SafetyCertificateOutlined style={{ color: '#f87171' }} /> 📍 Experimind Labs HQ — Main Exit
          </div>
        </div>
      </Card>

      {!hideExtraUI && (
        <div style={{ marginTop: 16, zIndex: 2 }}>
          <Button
            type="primary"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            style={{
              height: 42,
              padding: '0 20px',
              borderRadius: 12,
              fontWeight: 700,
              background: '#dc2626',
              borderColor: '#ef4444',
              boxShadow: '0 10px 20px rgba(220, 38, 38, 0.4)',
            }}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckOutQrKiosk;