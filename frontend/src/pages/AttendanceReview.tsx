import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Input, Select, Button, Typography, Avatar, message } from 'antd';
import { SearchOutlined, CheckOutlined, ClockCircleOutlined, CheckSquareOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

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

const AttendanceReview: React.FC = () => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchAttendanceAudit = async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/attendance');
      const list = Array.isArray(res) ? res : (res?.data || []);
      const mapped: AuditRecord[] = list.map((item: any) => ({
        id: item.id,
        internName: item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Intern',
        department: item.user ? item.user.department || 'Engineering' : 'General',
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
        checkIn: item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        checkOut: item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        workHours: item.workHours || null,
        status: item.status,
        isVerified: Boolean(item.approvedBy),
      }));
      setLogs(mapped);
    } catch (err: any) {
      message.error(err.message || 'Failed to load attendance audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceAudit();
  }, []);

  const handleVerifySingle = async (record: AuditRecord) => {
    try {
      await apiService.put(`/attendance/${record.id}/verify`);
      setLogs((prev) => prev.map((l) => (l.id === record.id ? { ...l, isVerified: true } : l)));
      message.success(`Attendance record verified for ${record.internName}`);
    } catch (err: any) {
      message.error(err.message || 'Failed to verify attendance');
    }
  };

  const handleBulkVerify = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await Promise.all(selectedRowKeys.map((id) => apiService.put(`/attendance/${id}/verify`)));
      setLogs((prev) => prev.map((l) => (selectedRowKeys.includes(l.id) ? { ...l, isVerified: true } : l)));
      message.success(`Successfully verified ${selectedRowKeys.length} attendance records!`);
      setSelectedRowKeys([]);
    } catch (err: any) {
      message.error(err.message || 'Bulk verification failed');
    }
  };

  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = logs.filter((l) => {
    const matchesSearch = l.internName.toLowerCase().includes(searchText.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || l.department === deptFilter;
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'UNVERIFIED'
        ? !l.isVerified
        : l.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
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
          <Space>
            <Select value={deptFilter} onChange={setDeptFilter} style={{ width: 160 }}>
              <Select.Option value="ALL">All Departments</Select.Option>
              <Select.Option value="Engineering">Engineering</Select.Option>
              <Select.Option value="Data Science">Data Science</Select.Option>
              <Select.Option value="Product UI">Product UI</Select.Option>
              <Select.Option value="DevOps">DevOps</Select.Option>
            </Select>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
              <Select.Option value="ALL">All Statuses</Select.Option>
              <Select.Option value="UNVERIFIED">Unverified Only</Select.Option>
              <Select.Option value="PRESENT">Present</Select.Option>
              <Select.Option value="LATE">Late</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (newRowKeys) => setSelectedRowKeys(newRowKeys),
          }}
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default AttendanceReview;
