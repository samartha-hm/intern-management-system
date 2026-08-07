import React, { useState } from 'react';
import { Card, Table, Button, Tag, Space, Input, Select, Modal, Form, Switch, message, Avatar, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, CrownOutlined, SafetyCertificateOutlined, TeamOutlined, ReadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'MENTOR' | 'INTERN';
  department: string;
  isActive: boolean;
  totalProgramDays?: number;
}

const INITIAL_USERS: UserItem[] = [
  { id: '1', name: 'Admin User', email: 'admin@experimindlabs.com', role: 'ADMIN', department: 'Management', isActive: true },
  { id: '2', name: 'HR Lead', email: 'hr@experimindlabs.com', role: 'HR', department: 'Human Resources', isActive: true },
  { id: '3', name: 'Jane Smith', email: 'mentor@experimindlabs.com', role: 'MENTOR', department: 'Engineering', isActive: true },
  { id: '4', name: 'John Doe', email: 'intern@experimindlabs.com', role: 'INTERN', department: 'Engineering', isActive: true, totalProgramDays: 65 },
  { id: '5', name: 'David Miller', email: 'david.m@experimindlabs.com', role: 'MENTOR', department: 'Data Science', isActive: true },
];

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreateUser = (values: any) => {
    const newUser: UserItem = {
      id: String(users.length + 1),
      name: `${values.firstName} ${values.lastName}`,
      email: values.email,
      role: values.role,
      department: values.department || 'General',
      isActive: true,
      totalProgramDays: values.role === 'INTERN' ? (values.totalProgramDays || 65) : undefined,
    };
    setUsers([newUser, ...users]);
    setIsModalOpen(false);
    form.resetFields();
    message.success(`User ${newUser.name} created successfully!`);
  };

  const toggleUserStatus = (id: string, active: boolean) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: active } : u)));
    message.info(`User status updated.`);
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: UserItem) => (
        <Space>
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

        <Table columns={columns} dataSource={filteredUsers} rowKey="id" pagination={{ pageSize: 6 }} />
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
    </div>
  );
};

export default Users;
