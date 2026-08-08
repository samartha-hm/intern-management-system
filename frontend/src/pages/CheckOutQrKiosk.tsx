import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Tag, QRCode, Progress } from 'antd';
import { FullscreenOutlined, SafetyCertificateOutlined, LogoutOutlined, PrinterOutlined, SyncOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const CheckOutQrKiosk: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [securitySalt, setSecuritySalt] = useState(Math.floor(Date.now() / 30000));

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const remainingSecs = 30 - (Math.floor(now.getTime() / 1000) % 30);
      setRefreshCountdown(remainingSecs);
      setSecuritySalt(Math.floor(now.getTime() / 30000));
    }, 1000);
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

  const handlePrint = () => {
    window.print();
  };

  const checkOutPayload = JSON.stringify({
    type: 'CHECK_OUT',
    office: 'EXPERIMIND_LABS_HQ',
    token: `EXPERIMIND-OFFICE-CHECKOUT-SALT-${securitySalt}`,
    date: currentTime.toISOString().split('T')[0],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '82vh', gap: 20, padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <Tag color="red" icon={<SafetyCertificateOutlined />} style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20, marginBottom: 8 }}>
          OFFICIAL WORKPLACE EXIT ATTENDANCE KIOSK
        </Tag>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Experimind Labs Exit Display</Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Scan this dynamic Exit QR wallpaper to log your evening check-out and submit your work summary.
        </Text>
      </div>

      <Card
        styles={{ body: { padding: '28px 36px', textAlign: 'center' } }}
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 24,
          boxShadow: '0 25px 50px rgba(220, 38, 38, 0.15)',
          border: '2px solid #fecaca',
          background: 'linear-gradient(180deg, #ffffff 0%, #fef2f2 100%)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tag color="red" style={{ marginBottom: 16, fontSize: 14, padding: '6px 18px', borderRadius: 20, fontWeight: 800 }}>
            <LogoutOutlined style={{ marginRight: 8 }} />
            EXIT CHECK-OUT KIOSK
          </Tag>

          <div style={{ padding: 24, background: '#fff', borderRadius: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '2px solid #f87171', marginBottom: 16 }}>
            <QRCode value={checkOutPayload} size={280} color="#b91c1c" icon="/favicon.ico" />
          </div>

          <div style={{ width: '80%', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#dc2626', marginBottom: 4, fontWeight: 600 }}>
              <span><SyncOutlined spin style={{ marginRight: 4 }} /> Security Token Refresh</span>
              <span>{refreshCountdown}s</span>
            </div>
            <Progress percent={Math.round((refreshCountdown / 30) * 100)} showInfo={false} strokeColor="#dc2626" size="small" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#b91c1c', fontFamily: 'monospace', letterSpacing: 1 }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>

          <Tag color="blue" style={{ marginTop: 12, fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>
            📍 Experimind Labs HQ — Exit Doors Kiosk
          </Tag>
        </div>
      </Card>

      <Space size={12}>
        <Button type="primary" danger icon={<FullscreenOutlined />} onClick={toggleFullscreen} style={{ height: 44, borderRadius: 10, fontWeight: 700 }}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk Mode'}
        </Button>
        <Button icon={<PrinterOutlined />} onClick={handlePrint} style={{ height: 44, borderRadius: 10, fontWeight: 700 }}>
          Print Kiosk Poster
        </Button>
      </Space>
    </div>
  );
};

export default CheckOutQrKiosk;
