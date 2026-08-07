import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Tag, QRCode } from 'antd';
import { FullscreenOutlined, SafetyCertificateOutlined, LogoutOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const CheckOutQrKiosk: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  const checkOutPayload = JSON.stringify({
    type: 'CHECK_OUT',
    office: 'EXPERIMIND_LABS_HQ',
    token: 'EXPERIMIND-OFFICE-CHECKOUT-2026-TOKEN',
    date: new Date().toISOString().split('T')[0],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 20, padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <Tag color="red" icon={<SafetyCertificateOutlined />} style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20, marginBottom: 8 }}>
          OFFICIAL OFFICE ATTENDANCE KIOSK (EXIT)
        </Tag>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Experimind Labs Exit Display</Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Scan this Check-Out (Exit) QR Code to log your evening departure and submit work diary.
        </Text>
      </div>

      <Card
        styles={{ body: { padding: '24px 36px 36px 36px', textAlign: 'center' } }}
        style={{
          width: '100%',
          maxWidth: 500,
          borderRadius: 24,
          boxShadow: '0 20px 40px rgba(220, 38, 38, 0.15)',
          border: '2px solid #fecaca',
          background: 'linear-gradient(180deg, #ffffff 0%, #fef2f2 100%)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16 }}>
          <Tag color="red" style={{ marginBottom: 16, fontSize: 14, padding: '6px 16px', borderRadius: 6, fontWeight: 800 }}>
            <LogoutOutlined style={{ marginRight: 8 }} />
            EVENING EXIT SCANNER
          </Tag>
          <div style={{ padding: 24, background: '#fff', borderRadius: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.08)', border: '2px solid #f87171' }}>
            <QRCode value={checkOutPayload} size={280} color="#b91c1c" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#b91c1c', fontFamily: 'monospace', letterSpacing: 1 }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>

          <Tag color="blue" style={{ marginTop: 12, fontSize: 12, padding: '4px 12px', borderRadius: 6 }}>
            📍 Experimind Labs HQ — Exit Doors
          </Tag>
        </div>
      </Card>

      <Space size={12}>
        <Button type="primary" icon={<FullscreenOutlined />} onClick={toggleFullscreen} danger style={{ height: 44, borderRadius: 10, fontWeight: 700 }}>
          {isFullscreen ? 'Exit Fullscreen Kiosk' : 'Wallpaper / Fullscreen Mode'}
        </Button>
      </Space>
    </div>
  );
};

export default CheckOutQrKiosk;
