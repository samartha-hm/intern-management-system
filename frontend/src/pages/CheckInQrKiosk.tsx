import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Tag, QRCode } from 'antd';
import { FullscreenOutlined, SafetyCertificateOutlined, LoginOutlined, PrinterOutlined } from '@ant-design/icons';

import apiService from '../services/apiService';

const { Title, Text } = Typography;

const CheckInQrKiosk: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [serverNonce, setServerNonce] = useState<string>('');

  const fetchServerNonce = async () => {
    try {
      const res = await apiService.get('/attendance/qr-nonce?kind=ENTRANCE');
      if (res && res.nonce) {
        setServerNonce(res.nonce);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchServerNonce();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

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

  const handlePrint = () => {
    window.print();
  };

  const todayStr = currentTime.toISOString().split('T')[0];

  const checkInPayload = JSON.stringify({
    type: 'CHECK_IN',
    office: 'EXPERIMIND_LABS_HQ',
    nonce: serverNonce || `ENTRANCE-${todayStr}-DAILY-STABLE`,
    date: todayStr,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '82vh', gap: 20, padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <Tag color="green" icon={<SafetyCertificateOutlined />} style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20, marginBottom: 8 }}>
          OFFICIAL DAILY WORKPLACE ENTRANCE ATTENDANCE KIOSK
        </Tag>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Experimind Labs Entrance Display</Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Scan this stable daily Entrance QR wallpaper using your mobile browser to clock in today.
        </Text>
      </div>

      <Card
        styles={{ body: { padding: '28px 36px', textAlign: 'center' } }}
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 24,
          boxShadow: '0 25px 50px rgba(16, 185, 129, 0.15)',
          border: '2px solid #a7f3d0',
          background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tag color="green" style={{ marginBottom: 16, fontSize: 14, padding: '6px 18px', borderRadius: 20, fontWeight: 800 }}>
            <LoginOutlined style={{ marginRight: 8 }} />
            ENTRANCE CHECK-IN KIOSK
          </Tag>

          <div style={{ padding: 24, background: '#fff', borderRadius: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '2px solid #34d399', marginBottom: 16 }}>
            <QRCode value={checkInPayload} size={280} color="#047857" icon="/favicon.ico" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Tag color="cyan" style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>
              ✓ Daily Wallpaper Active • Valid until 11:59 PM Tonight ({todayStr})
            </Tag>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#047857', fontFamily: 'monospace', letterSpacing: 1 }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>

          <Tag color="blue" style={{ marginTop: 12, fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>
            📍 Experimind Labs HQ — Entrance Kiosk
          </Tag>
        </div>
      </Card>

      <Space size={12}>
        <Button type="primary" icon={<FullscreenOutlined />} onClick={toggleFullscreen} style={{ height: 44, borderRadius: 10, fontWeight: 700, background: '#059669', borderColor: '#059669' }}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk Mode'}
        </Button>
        <Button icon={<PrinterOutlined />} onClick={handlePrint} style={{ height: 44, borderRadius: 10, fontWeight: 700 }}>
          Print Kiosk Poster
        </Button>
      </Space>
    </div>
  );
};

export default CheckInQrKiosk;
