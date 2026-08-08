import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Input, Select, Modal, Form, Switch, message, Avatar, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, CrownOutlined, SafetyCertificateOutlined, TeamOutlined, ReadOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'MENTOR' | 'INTERN';
  department: string;
  contractDays?: number;
  isActive: boolean;
  totalProgramDays?: number;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDays, setEditDays] = useState<number>(65);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/users');
      const mapped = data.map((u: any) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        department: u.department || 'General',
        contractDays: u.contractDays || 65,
        isActive: u.isActive,
      }));
      setUsers(mapped);
    } catch (err: any) {
      message.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateContract = async () => {
    if (!selectedUser) return;
    try {
      await apiService.put(`/users/${selectedUser.id}/contract`, {
        contractDays: editDays,
      });
      message.success(`Custom contract updated to ${editDays} days for ${selectedUser.name}!`);
      setContractModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      message.error(err.message || 'Failed to update contract');
    }
  };

  const handleCreateUser = async (values: any) => {
    try {
      await apiService.post('/auth/register', {
        email: values.email,
        password: values.password || 'password123',
        firstName: values.firstName,
        lastName: values.lastName,
      });
      message.success(`User ${values.firstName} ${values.lastName} registered successfully!`);
      setIsModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (err: any) {
      message.error(err.message || 'Failed to create user');
    }
  };

  const toggleUserStatus = async (id: string, active: boolean) => {
    try {
      await apiService.put(`/users/${id}`, { isActive: active });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: active } : u)));
      message.success(`User status updated to ${active ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      message.error(err.message || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchText.toLowerCase()) || user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      title: 'User Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: UserItem) => (
        <Space>
          <Avatar style={{ backgroundColor: record.role === 'ADMIN' ? '#ef4444' : record.role === 'HR' ? '#8b5cf6' : record.role === 'MENTOR' ? '#3b82f6' : '#10b981' }}>
            {text[0]}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 14 }}>{text}</Text>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleConfig: Record<string, { color: string; icon: any }> = {
          ADMIN: { color: 'red', icon: <CrownOutlined /> },
          HR: { color: 'purple', icon: <SafetyCertificateOutlined /> },
          MENTOR: { color: 'blue', icon: <TeamOutlined /> },
          INTERN: { color: 'green', icon: <ReadOutlined /> },
        };
        const cfg = roleConfig[role] || { color: 'default', icon: <UserOutlined /> };
        return (
          <Tag color={cfg.color} icon={cfg.icon} style={{ fontWeight: 600 }}>
            {role}
          </Tag>
        );
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => <Tag style={{ borderRadius: 4 }}>{dept}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: UserItem) => (
        <Switch
          checked={isActive}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={(checked) => toggleUserStatus(record.id, checked)}
        />
      ),
    },
    {
      title: 'Contract Days',
      dataIndex: 'contractDays',
      key: 'contractDays',
      render: (days: number, record: UserItem) => (
        record.role === 'INTERN' ? <Tag color="cyan" style={{ fontWeight: 700 }}>{days || 65} Days</Tag> : '-'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: UserItem) => (
        <Space>
          {record.role === 'INTERN' && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setSelectedUser(record);
                setEditDays(record.contractDays || 65);
                setContractModalOpen(true);
              }}
            >
              Customize Contract
            </Button>
          )}
          <Button size="small" type="link" onClick={() => message.info(`Editing user ${record.name}`)}>Edit</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>User Management</Title>
          <Text type="secondary">Manage system roles, permissions, and active users</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add System User
        </Button>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <Input
            placeholder="Search by user name or email..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ width: 320, borderRadius: 8 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 150 }}>
            <Select.Option value="ALL">All Roles</Select.Option>
            <Select.Option value="ADMIN">Admin</Select.Option>
            <Select.Option value="HR">HR</Select.Option>
            <Select.Option value="MENTOR">Mentor</Select.Option>
            <Select.Option value="INTERN">Intern</Select.Option>
          </Select>
        </div>

        <Table columns={columns} dataSource={filteredUsers} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      <Modal
        title="Add New System User"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Add User"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser} style={{ marginTop: 16 }}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true }, { type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select role">
              <Select.Option value="INTERN">Intern</Select.Option>
              <Select.Option value="MENTOR">Mentor</Select.Option>
              <Select.Option value="HR">HR</Select.Option>
              <Select.Option value="ADMIN">Admin</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input placeholder="e.g. Engineering" />
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) =>
              getFieldValue('role') === 'INTERN' ? (
                <Form.Item name="totalProgramDays" label="Internship Duration (Total Days)" rules={[{ required: true, message: 'Please specify the internship duration in days' }]}>
                  <Input type="number" placeholder="e.g. 65" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Student Contract Modal */}
      <Modal
        title={`Customize Contract Duration — ${selectedUser?.name}`}
        open={contractModalOpen}
        onCancel={() => setContractModalOpen(false)}
        onOk={handleUpdateContract}
        okText="Save Contract"
      >
        <div style={{ padding: '12px 0' }}>
          <Text style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Program Contract Tenure Duration for this Student (in Days):
          </Text>
          <Input
            type="number"
            value={editDays}
            onChange={(e) => setEditDays(Number(e.target.value))}
            placeholder="e.g. 60, 90, 120"
            style={{ width: '100%' }}
          />
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
            Customize the contract tenure duration specifically for {selectedUser?.name}.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
