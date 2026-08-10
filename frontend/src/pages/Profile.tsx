import React, { useState } from 'react';
import { Card, Row, Col, Avatar, Button, Typography, Tag, Descriptions, Form, Input, message } from 'antd';
import { UserOutlined, PhoneOutlined, BankOutlined, SafetyCertificateOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../redux/slices/authSlice';
import type { AppDispatch } from '../redux/store';
import apiService from '../services/apiService';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await apiService.put('/auth/me', values);
      await dispatch(fetchCurrentUser());
      setIsEditing(false);
      message.success('Profile updated successfully!');
    } catch (err: any) {
      message.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>My Profile & Settings</Title>
        <Text type="secondary">View and manage your account details and department assignment</Text>
      </div>

      <Row gutter={[20, 20]}>
        {/* Profile Card Sidebar */}
        <Col xs={24} lg={8}>
          <Card styles={{ body: { padding: 28, textAlign: 'center' } }}>
            <Avatar
              size={96}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#6366f1', marginBottom: 16, fontSize: 40, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
            >
              {currentUser?.firstName?.[0]}
            </Avatar>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              {currentUser?.firstName || 'User'} {currentUser?.lastName || ''}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {currentUser?.email || 'user@experimindlabs.com'}
            </Text>
            <Tag color="purple" style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20, fontWeight: 700 }}>
              {currentUser?.role || 'INTERN'}
            </Tag>

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 24, paddingTop: 20, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <BankOutlined style={{ color: '#6366f1' }} />
                <Text style={{ fontSize: 13 }}>Department: <Text strong>{currentUser?.department || 'Engineering'}</Text></Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <SafetyCertificateOutlined style={{ color: '#10b981' }} />
                <Text style={{ fontSize: 13 }}>Position: <Text strong>{currentUser?.position || 'Software Intern'}</Text></Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PhoneOutlined style={{ color: '#3b82f6' }} />
                <Text style={{ fontSize: 13 }}>Phone: <Text strong>{currentUser?.phone || 'Not provided'}</Text></Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Account Details Card */}
        <Col xs={24} lg={16}>
          <Card styles={{ body: { padding: 24 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0 }}>Account Details</Title>
              {!isEditing ? (
                <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit Profile</Button>
              ) : (
                <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => form.submit()}>Save Changes</Button>
              )}
            </div>

            {!isEditing ? (
              <Descriptions bordered column={1} labelStyle={{ fontWeight: 700, width: '35%' }}>
                <Descriptions.Item label="First Name">{currentUser?.firstName || 'User'}</Descriptions.Item>
                <Descriptions.Item label="Last Name">{currentUser?.lastName || ''}</Descriptions.Item>
                <Descriptions.Item label="Email Address">{currentUser?.email || ''}</Descriptions.Item>
                <Descriptions.Item label="Phone Number">{currentUser?.phone || 'Not provided'}</Descriptions.Item>
                <Descriptions.Item label="Role">{currentUser?.role || 'INTERN'}</Descriptions.Item>
                <Descriptions.Item label="Department">{currentUser?.department || 'Engineering'}</Descriptions.Item>
                <Descriptions.Item label="Position">{currentUser?.position || 'Software Engineering Intern'}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  firstName: currentUser?.firstName || '',
                  lastName: currentUser?.lastName || '',
                  email: currentUser?.email || '',
                  phone: currentUser?.phone || '',
                  department: currentUser?.department || 'Engineering',
                  position: currentUser?.position || 'Software Engineering Intern',
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="email" label="Email Address" rules={[{ required: true }, { type: 'email' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="phone" label="Phone Number">
                      <Input placeholder="+1 (555) 000-0000" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="department" label="Department">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="position" label="Position">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
