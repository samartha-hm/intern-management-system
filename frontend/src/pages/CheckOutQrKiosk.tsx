import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Space,
  Button,
  Tag,
  QRCode,
  Spin,
  message,
} from 'antd';
import {
  FullscreenOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  PrinterOutlined,
  CameraOutlined,
  CheckOutlined,
} from '@ant-design/icons';

import apiService from '../services/apiService';
import QrScanner from '../components/QrScanner';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const CheckOutQrKiosk: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not kiosk role
  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'KIOSK') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, currentUser?.role, navigate]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [serverNonce, setServerNonce] = useState<string>('');
  const [nonceDate, setNonceDate] = useState<string>(''); // date (YYYY-MM-DD) for which nonce is fetched
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const fetchServerNonce = async () => {
    try {
      const res = await apiService.get('/attendance/qr-nonce?kind=EXIT');
      if (res && res.nonce) {
        setServerNonce(res.nonce);
        setNonceDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Failed to fetch QR nonce', err);
      // Keep existing nonce if any
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

  // Refetch nonce if the date changes (e.g., past midnight)
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

  const handlePrint = () => {
    window.print();
  };

  const todayStr = currentTime.toISOString().split('T')[0];

  const checkOutPayload = JSON.stringify({
    type: 'CHECK_OUT',
    office: 'EXPERIMIND_LABS_HQ',
    nonce: serverNonce || `EXIT-${todayStr}-DAILY-STABLE`,
    date: todayStr,
  });

  const handleScanSuccess = (decodedText: string) => {
    setLastScan(decodedText);
    setScanError(null);
    message.success(`Scanned: ${decodedText}`);
    // Example: send to backend for verification (exit)
    // apiService.post('/attendance/scan', { data: decodedText, type: 'EXIT' });
  };

  const handleScanError = (error: string) => {
    setScanError(error);
    message.error(`Scan error: ${error}`);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '82vh',
        gap: 20,
        padding: 24,
        background: '#fef2f2',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Tag color="red" icon={<SafetyCertificateOutlined />} style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20, marginBottom: 8 }}>
          OFFICIAL DAILY WORKPLACE EXIT ATTENDANCE KIOSK
        </Tag>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Experimind Labs Exit Display</Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Scan this stable daily Exit QR wallpaper to log your evening check-out and submit your work summary.
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

          {/* QR Code Display Area */}
          <div style={{ padding: 24, background: '#fff', borderRadius: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '2px solid #f87171', marginBottom: 16 }}>
            <QRCode value={checkOutPayload} size={260} color="#b91c1c" icon="/favicon.ico" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Tag color="orange" style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>
              ��������� ������� ������� ����� ������� ����� ����� ��� ������� ����� ����� ��� ����� ��� ��� � ������� ����� ����� ��� ����� ��� ��� � ����� ��� ��� � ��� � � ✓ Daily Exit Wallpaper Active • Valid until 11:59 PM Tonight ({todayStr})
            </Tag>
          </div>

          {/* Scanner Area */}
          <div style={{ width: '100%', maxWidth: 500, marginTop: 24 }}>
            <Tag color="blue" style={{ fontSize: 14, padding: '6px 12px', borderRadius: 20, fontWeight: 600, marginBottom: 8 }}>
              <CameraOutlined style={{ marginRight: 6 }} /> Live Scanner (Rear Camera)
            </Tag>
            <div style={{ position: 'relative', border: '2px dashed #f87171', borderRadius: 16, background: '#fef2f2', minHeight: 280 }}>
              {isScanning ? (
                <Spin tip="Initializing camera..." size="large" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              ) : scanError ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#dc2626' }}>
                  <CameraOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>{scanError}</div>
                </div>
              ) : lastScan ? (
                <div style={{ padding: 20, textAlign: 'center' }}>
                  <CheckOutlined style={{ fontSize: 24, color: '#16a34a', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>Last scanned:</div>
                  <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', background: '#fff', padding: 8, borderRadius: 6, marginTop: 4, border: '1px solid #e5e7eb' }}>
                    {lastScan}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 30, textAlign: 'center', color: '#6b7280' }}>
                  <CameraOutlined style={{ fontSize: 28, marginBottom: 12 }} />
                  <div>Point tablet Camera at a QR code to scan</div>
                </div>
              )}
            </div>
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
            ������������ ������������ ������������ ������ ������������ ������ ������ ���� ������������ ������ ������ ���� ������ ���� ���� �� ���������� ���������� ���������� ���� ���������� ���� ���� �� ���������� ���� ���� �� ���� �� �� 📍 Experimind Labs HQ — Exit Doors Kiosk
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

      {/* Hidden QR scanner component (we handle UI manually) */}
      <QrScanner
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        autoStart
      />
    </div>
  );
};

export default CheckOutQrKiosk;