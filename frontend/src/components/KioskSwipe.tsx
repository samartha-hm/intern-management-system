import React, { useState, useRef } from 'react';
import CheckInQrKiosk from '../pages/CheckInQrKiosk';
import CheckOutQrKiosk from '../pages/CheckOutQrKiosk';
import { SwapOutlined, LoginOutlined, LogoutOutlined, LockOutlined } from '@ant-design/icons';
import { Modal, Input, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const KioskSwipe: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);

  const touchStartX = useRef<number | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleOpenLogoutModal = () => {
    setEnteredPassword('');
    setIsModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    if (!enteredPassword) {
      message.warning('Please enter the password to exit');
      return;
    }

    // Verify kiosk/admin password (EXP@123labs or password123)
    const validPasswords = ['EXP@123labs', 'password123', 'EXP@123labs'.toLowerCase()];
    if (!validPasswords.includes(enteredPassword.trim())) {
      message.error('Incorrect password. Authorization failed.');
      setEnteredPassword('');
      return;
    }

    try {
      setVerifying(true);
      await logout();
      message.success('Session ended. Logged out successfully.');
      setIsModalVisible(false);
      navigate('/login', { replace: true });
    } catch {
      localStorage.clear();
      window.location.href = '/login';
    } finally {
      setVerifying(false);
    }
  };

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
      {/* Top Floating Center Navigation Bar (ENTRANCE / EXIT) */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          padding: '6px 16px',
          borderRadius: 30,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        <button
          onClick={() => setActiveTab(0)}
          style={{
            border: 'none',
            background: activeTab === 0 ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
            color: activeTab === 0 ? '#ffffff' : '#94a3b8',
            padding: '7px 20px',
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

        <SwapOutlined style={{ color: '#64748b', fontSize: 14 }} />

        <button
          onClick={() => setActiveTab(1)}
          style={{
            border: 'none',
            background: activeTab === 1 ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' : 'transparent',
            color: activeTab === 1 ? '#ffffff' : '#94a3b8',
            padding: '7px 20px',
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

      {/* Separate Top-Right Floating Secure Logout Button */}
      <button
        onClick={handleOpenLogoutModal}
        title="Exit Display Mode (Password Required)"
        style={{
          position: 'fixed',
          top: 16,
          right: 20,
          zIndex: 1001,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          padding: '7px 16px',
          borderRadius: 22,
          fontWeight: 800,
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          transition: 'all 0.3s ease',
        }}
      >
        <LockOutlined style={{ color: '#ef4444', fontSize: 13 }} />
        <span>LOGOUT</span>
      </button>

      {/* Password Verification Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <LockOutlined style={{ color: '#ef4444' }} />
            <span style={{ fontWeight: 800 }}>Admin Password Required</span>
          </div>
        }
        open={isModalVisible}
        onOk={handleConfirmLogout}
        onCancel={() => setIsModalVisible(false)}
        okText="Verify & Logout"
        cancelText="Cancel"
        confirmLoading={verifying}
        okButtonProps={{ danger: true, style: { fontWeight: 700 } }}
        centered
        destroyOnClose
      >
        <div style={{ padding: '12px 0' }}>
          <p style={{ color: '#475569', fontSize: 14, marginBottom: 16 }}>
            Please enter the Admin password to log out.
          </p>
          <Input.Password
            placeholder="Enter password..."
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            onPressEnter={handleConfirmLogout}
            autoFocus
            style={{ borderRadius: 10, height: 42 }}
          />
        </div>
      </Modal>

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
        <div style={{ width: '100vw', height: '100vh', overflowY: 'auto' }}>
          <CheckInQrKiosk hideExtraUI={true} />
        </div>
        <div style={{ width: '100vw', height: '100vh', overflowY: 'auto' }}>
          <CheckOutQrKiosk hideExtraUI={true} />
        </div>
      </div>
    </div>
  );
};

export default KioskSwipe;