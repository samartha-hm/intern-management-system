import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, QRCode, Button } from 'antd';
import { SafetyCertificateOutlined, LoginOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface CheckInQrKioskProps {
  hideExtraUI?: boolean;
}

const CheckInQrKiosk: React.FC<CheckInQrKioskProps> = ({
  hideExtraUI = false,
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
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const fetchServerNonce = async () => {
    try {
      const res = await apiService.get('/attendance/qr-nonce?kind=ENTRANCE');
      if (res && res.nonce) {
        setServerNonce(res.nonce);
        setNonceDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Failed to fetch Entrance QR nonce', err);
    }
  };

  useEffect(() => {
    fetchServerNonce();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
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

  // Check if screen is wider than 640px for side-by-side flex layout
  const isWideLayout = windowDimensions.width >= 640 && windowDimensions.width > windowDimensions.height;

  const todayStr = currentTime.toISOString().split('T')[0];
  const checkInPayload = JSON.stringify({
    type: 'CHECK_IN',
    office: 'EXPERIMIND_LABS_HQ',
    nonce: serverNonce || `ENTRANCE-${todayStr}-DAILY-STABLE`,
    date: todayStr,
  });

  const loginUrl = `${window.location.origin}/login`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        padding: isWideLayout ? '50px 24px 20px 24px' : '60px 16px 20px 16px',
        background: 'radial-gradient(circle at 50% 20%, #064e3b 0%, #022c22 60%, #011713 100%)',
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
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Info */}
      <div style={{ textAlign: 'center', zIndex: 2, marginBottom: isWideLayout ? 12 : 16 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '5px 16px', borderRadius: 30, marginBottom: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: 12, letterSpacing: 1.2 }}>LIVE DISPLAY</span>
        </div>
        <Title level={2} style={{ margin: 0, color: '#ffffff', fontWeight: 900, fontSize: isWideLayout ? 26 : 24, letterSpacing: -0.5 }}>
          Experimind Labs Workplace Entrance
        </Title>
        <Text style={{ color: '#94a3b8', fontSize: 14, display: 'block', marginTop: 2 }}>
          Scan this QR code with your smartphone camera to Clock-In
        </Text>
      </div>

      {/* Main Glassmorphic Display Card */}
      <Card
        styles={{
          body: {
            padding: isWideLayout ? '28px 36px' : '24px 20px',
            display: 'flex',
            flexDirection: isWideLayout ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: isWideLayout ? 32 : 16,
          },
        }}
        style={{
          width: isWideLayout ? '94%' : '90%',
          maxWidth: isWideLayout ? 1000 : 450,
          borderRadius: 28,
          background: 'rgba(6, 78, 59, 0.45)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(16, 185, 129, 0.25)',
          zIndex: 2,
        }}
      >
        {/* Left Side: QR Display Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: isWideLayout ? '1 1 45%' : 'auto', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <LoginOutlined style={{ fontSize: 18, color: '#34d399' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#ecfdf5', letterSpacing: 0.5 }}>MORNING CHECK-IN</span>
          </div>

          <div
            style={{
              padding: 16,
              background: '#ffffff',
              borderRadius: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
              border: '5px solid #10b981',
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <QRCode value={checkInPayload} size={isWideLayout ? 260 : 230} color="#022c22" icon="/icon-192.png" />
          </div>

          <Tag
            color="success"
            style={{
              fontSize: 11,
              padding: '4px 12px',
              borderRadius: 20,
              fontWeight: 700,
              border: 'none',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#6ee7b7',
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
            flex: isWideLayout ? '1 1 50%' : 'auto',
            borderTop: isWideLayout ? 'none' : '1px solid rgba(255,255,255,0.1)',
            borderLeft: isWideLayout ? '1px solid rgba(255,255,255,0.15)' : 'none',
            paddingTop: isWideLayout ? 0 : 14,
            paddingLeft: isWideLayout ? 28 : 0,
            width: isWideLayout ? 'auto' : '100%',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: isWideLayout ? 48 : 36, fontWeight: 900, color: '#34d399', fontFamily: 'monospace', letterSpacing: 1.5, textShadow: '0 0 20px rgba(52,211,153,0.5)', whiteSpace: 'nowrap' }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: isWideLayout ? 16 : 14, color: '#cbd5e1', marginTop: 4, fontWeight: 600 }}>
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: isWideLayout ? 13 : 12, color: '#94a3b8', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <SafetyCertificateOutlined style={{ color: '#34d399', fontSize: 14 }} /> 📍 Experimind Labs HQ — Main Entrance
          </div>
        </div>
      </Card>

      {/* Small Login Page QR Code Badge at the Bottom */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '10px 18px',
          borderRadius: 20,
          marginTop: 18,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 2,
        }}
      >
        <div style={{ padding: 6, background: '#ffffff', borderRadius: 12, display: 'flex', border: '2px solid #38bdf8' }}>
          <QRCode value={loginUrl} size={64} bordered={false} color="#0f172a" />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📱 Open Login Page on Smartphone</span>
          </div>
          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>Scan this QR code to access login portal on your mobile browser</div>
          <div style={{ fontSize: 11, color: '#38bdf8', fontFamily: 'monospace', marginTop: 2, fontWeight: 700 }}>{loginUrl}</div>
        </div>
      </div>

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
              background: '#059669',
              borderColor: '#10b981',
              boxShadow: '0 10px 20px rgba(5, 150, 105, 0.4)',
            }}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckInQrKiosk;