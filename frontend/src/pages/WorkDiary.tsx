import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Space, Timeline, Alert } from 'antd';
import { BookOutlined, ClockCircleOutlined, MessageOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ReadOnlyDiaryEntry {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  workHours: number;
  workSummary: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'APPROVED';
  feedback?: string;
}

const SAMPLE_HISTORICAL_DIARIES: ReadOnlyDiaryEntry[] = [
  {
    id: '1',
    date: '2026-08-06',
    checkInTime: '09:15 AM',
    checkOutTime: '05:30 PM',
    workHours: 8.0,
    workSummary: 'Refactored backend authentication middleware and added express type extensions for req.user.',
    status: 'SUBMITTED',
  },
  {
    id: '2',
    date: '2026-08-05',
    checkInTime: '09:42 AM',
    checkOutTime: '05:30 PM',
    workHours: 7.8,
    workSummary: 'Integrated Ant Design v5 Card styles and responsive layout grids for dashboard widgets.',
    status: 'APPROVED',
    feedback: 'Great progress on UI polish! Keep up the good work.',
  },
  {
    id: '3',
    date: '2026-08-04',
    checkInTime: '09:05 AM',
    checkOutTime: '05:30 PM',
    workHours: 8.4,
    workSummary: 'Created API routes for document management and file upload limits with multer.',
    status: 'APPROVED',
    feedback: 'Clean route architecture.',
  },
];

const WorkDiary: React.FC = () => {
  const [diaries] = useState<ReadOnlyDiaryEntry[]>(SAMPLE_HISTORICAL_DIARIES);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <Text strong style={{ fontSize: 13 }}>
          <CalendarOutlined style={{ marginRight: 6, color: '#6366f1' }} />
          {date}
        </Text>
      ),
    },
    {
      title: 'Working Hours',
      key: 'hours',
      render: (_: any, record: ReadOnlyDiaryEntry) => (
        <Text style={{ fontSize: 12 }}>
          {record.checkInTime} - {record.checkOutTime} (<strong style={{ color: '#059669' }}>{record.workHours} hrs</strong>)
        </Text>
      ),
    },
    {
      title: 'Check-Out Work Summary Log',
      dataIndex: 'workSummary',
      key: 'workSummary',
      render: (txt: string) => <Paragraph style={{ margin: 0, fontSize: 13, color: '#334155' }}>{txt}</Paragraph>,
    },
    {
      title: 'Review Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'APPROVED' ? 'green' : 'gold'}>{status}</Tag>,
    },
    {
      title: 'Mentor Feedback',
      dataIndex: 'feedback',
      key: 'feedback',
      render: (fb?: string) => (fb ? <Text type="secondary" style={{ fontSize: 12, color: '#166534' }}>{fb}</Text> : <Text type="secondary" style={{ fontSize: 12 }}>Pending Review</Text>),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Daily Work Diary Log History</Title>
        <Text type="secondary">Read-only historical view of daily work summaries logged during your evening Check-Outs</Text>
      </div>

      <Alert
        message="Notice: Work Diaries are submitted during Check-Out"
        description="Daily work summaries are submitted when scanning the Exit QR code during evening Check-Out. This page provides a read-only historical record of your submitted logs and mentor feedback."
        type="info"
        showIcon
        style={{ borderRadius: 10 }}
      />

      <Card title="Submitted Work Summaries & Mentor Feedback" styles={{ body: { padding: 20 } }}>
        <Table columns={columns} dataSource={diaries} rowKey="id" pagination={{ pageSize: 6 }} />
      </Card>
    </div>
  );
};

export default WorkDiary;
