import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, QRCode, Button } from 'antd';
import { SafetyCertificateOutlined, LogoutOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface CheckOutQrKioskProps {
  hideExtraUI?: boolean;
}

const CheckOutQrKiosk: React.FC<CheckOutQrKioskProps> = ({ hideExtraUI = false }) => {
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
    return () => clearInterval(timer);
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
        minHeight: hideExtraUI ? '100vh' : '90vh',
        width: '100%',
        padding: '32px 16px',
        background: 'radial-gradient(circle at 50% 20%, #881337 0%, #450a0a 60%, #200404 100%)',
        color: '#fff',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
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
      <div style={{ textAlign: 'center', zIndex: 2, marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', padding: '6px 18px', borderRadius: 30, marginBottom: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
          <span style={{ color: '#fca5a5', fontWeight: 800, fontSize: 13, letterSpacing: 1.2 }}>LIVE EXIT KIOSK</span>
        </div>
        <Title level={2} style={{ margin: 0, color: '#ffffff', fontWeight: 900, fontSize: hideExtraUI ? 28 : 32, letterSpacing: -0.5 }}>
          Experimind Labs Workplace Exit
        </Title>
        <Text style={{ color: '#94a3b8', fontSize: 15, display: 'block', marginTop: 4 }}>
          Scan this daily Exit QR code with your smartphone camera to Clock-Out & submit Work Diary
        </Text>
      </div>

      {/* Main Glassmorphic Display Card */}
      <Card
        styles={{ body: { padding: hideExtraUI ? '28px 24px' : '36px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' } }}
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 28,
          background: 'rgba(136, 19, 55, 0.45)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(248, 113, 113, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(239, 68, 68, 0.25)',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <LogoutOutlined style={{ fontSize: 20, color: '#f87171' }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff1f2', letterSpacing: 0.5 }}>EVENING CHECK-OUT</span>
        </div>

        {/* High Contrast QR Container */}
        <div
          style={{
            padding: 24,
            background: '#ffffff',
            borderRadius: 24,
            boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
            border: '4px solid #ef4444',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <QRCode value={checkOutPayload} size={hideExtraUI ? 240 : 260} color="#450a0a" icon="/icon-192.png" />
        </div>

        {/* Live Security Nonce Badge */}
        <Tag
          color="error"
          style={{
            fontSize: 12,
            padding: '5px 14px',
            borderRadius: 20,
            fontWeight: 700,
            border: 'none',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            marginBottom: 20,
          }}
        >
          ⚡ Daily Security Nonce Active • Valid for Today ({todayStr})
        </Tag>

        {/* Digital Clock & Date */}
        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, width: '100%' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#f87171', fontFamily: 'monospace', letterSpacing: 1.5, textShadow: '0 0 15px rgba(248,113,113,0.4)' }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: 14, color: '#cbd5e1', marginTop: 2, fontWeight: 600 }}>
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <SafetyCertificateOutlined style={{ color: '#f87171' }} /> 📍 Experimind Labs HQ — Main Exit Gate
          </div>
        </div>
      </Card>

      {!hideExtraUI && (
        <div style={{ marginTop: 24, zIndex: 2 }}>
          <Button
            type="primary"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            style={{
              height: 46,
              padding: '0 24px',
              borderRadius: 14,
              fontWeight: 700,
              background: '#dc2626',
              borderColor: '#ef4444',
              boxShadow: '0 10px 20px rgba(220, 38, 38, 0.4)',
            }}
          >
            {isFullscreen ? 'Exit Fullscreen Mode' : 'Enter Fullscreen Kiosk Mode'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckOutQrKiosk;