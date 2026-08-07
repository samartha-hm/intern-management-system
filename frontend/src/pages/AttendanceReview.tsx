import React, { useState } from 'react';
import { Card, Table, Tag, Space, Input, Select, Button, Typography, Avatar, message } from 'antd';
import { SearchOutlined, CheckOutlined, ClockCircleOutlined, CheckSquareOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AuditRecord {
  id: string;
  internName: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workHours: number | null;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT';
  isVerified?: boolean;
}

const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  { id: '1', internName: 'John Doe', department: 'Engineering', date: '2026-08-06', checkIn: '09:15 AM', checkOut: null, workHours: null, status: 'PRESENT', isVerified: false },
  { id: '2', internName: 'Alice Walker', department: 'Data Science', date: '2026-08-06', checkIn: '09:45 AM', checkOut: null, workHours: null, status: 'LATE', isVerified: false },
  { id: '3', internName: 'Michael Chen', department: 'Product UI', date: '2026-08-06', checkIn: '09:05 AM', checkOut: null, workHours: null, status: 'PRESENT', isVerified: true },
  { id: '4', internName: 'Emily Davis', department: 'DevOps', date: '2026-08-05', checkIn: '09:10 AM', checkOut: '05:30 PM', workHours: 8.3, status: 'PRESENT', isVerified: true },
];

const AttendanceReview: React.FC = () => {
  const [logs, setLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [searchText, setSearchText] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleVerifySingle = (record: AuditRecord) => {
    setLogs((prev) => prev.map((l) => (l.id === record.id ? { ...l, isVerified: true } : l)));
    message.success(`Attendance record verified for ${record.internName}`);
  };

  const handleBulkVerify = () => {
    if (selectedRowKeys.length === 0) return;
    setLogs((prev) => prev.map((l) => (selectedRowKeys.includes(l.id) ? { ...l, isVerified: true } : l)));
    message.success(`Successfully verified ${selectedRowKeys.length} attendance records!`);
    setSelectedRowKeys([]);
  };

  const filtered = logs.filter((l) => {
    const matchesSearch = l.internName.toLowerCase().includes(searchText.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || l.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const columns = [
    {
      title: 'Intern',
      dataIndex: 'internName',
      key: 'internName',
      render: (name: string, record: AuditRecord) => (
        <Space>
          <Avatar style={{ backgroundColor: '#6366f1' }}>{name[0]}</Avatar>
          <div>
            <Text strong style={{ fontSize: 13 }}>{name}</Text>
            <div style={{ fontSize: 11, color: '#64748b' }}>{record.department}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Check-In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (t: string) => <Tag icon={<ClockCircleOutlined />} color="blue">{t}</Tag>,
    },
    {
      title: 'Check-Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (t: string | null) => (t ? <Tag icon={<ClockCircleOutlined />} color="purple">{t}</Tag> : <Text type="secondary">In Progress</Text>),
    },
    {
      title: 'Hours',
      dataIndex: 'workHours',
      key: 'workHours',
      render: (h: number | null) => (h ? <strong style={{ color: '#059669' }}>{h} hrs</strong> : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: AuditRecord) => {
        const colorMap: Record<string, string> = { PRESENT: 'green', LATE: 'gold', HALF_DAY: 'orange', ABSENT: 'red' };
        return (
          <Space>
            <Tag color={colorMap[status] || 'default'}>{status}</Tag>
            {record.isVerified && <Tag color="cyan">VERIFIED</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AuditRecord) => (
        <Button size="small" icon={<CheckOutlined />} onClick={() => handleVerifySingle(record)} disabled={record.isVerified}>
          {record.isVerified ? 'Verified' : 'Verify'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Intern Attendance Supervision</Title>
          <Text type="secondary">Monitor daily intern clock-in timestamps, working hours compliance, and perform batch verification</Text>
        </div>
        {selectedRowKeys.length > 0 && (
          <Button type="primary" icon={<CheckSquareOutlined />} onClick={handleBulkVerify} style={{ height: 40, fontWeight: 700, borderRadius: 8 }}>
            Bulk Verify ({selectedRowKeys.length} Selected)
          </Button>
        )}
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <Input
            placeholder="Search by intern name..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ width: 300, borderRadius: 8 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select value={deptFilter} onChange={setDeptFilter} style={{ width: 160 }}>
            <Select.Option value="ALL">All Departments</Select.Option>
            <Select.Option value="Engineering">Engineering</Select.Option>
            <Select.Option value="Data Science">Data Science</Select.Option>
            <Select.Option value="Product UI">Product UI</Select.Option>
            <Select.Option value="DevOps">DevOps</Select.Option>
          </Select>
        </div>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (newRowKeys) => setSelectedRowKeys(newRowKeys),
          }}
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 7 }}
        />
      </Card>
    </div>
  );
};

export default AttendanceReview;
