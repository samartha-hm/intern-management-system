import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Alert, message } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

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

const WorkDiary: React.FC = () => {
  const [diaries, setDiaries] = useState<ReadOnlyDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyDiaries = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/work-diary/my');
      const mapped: ReadOnlyDiaryEntry[] = data.map((d: any) => ({
        id: d.id,
        date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
        checkInTime: '09:00 AM',
        checkOutTime: '05:00 PM',
        workHours: d.hoursSpent || 8.0,
        workSummary: d.tasksDone,
        status: d.status,
        feedback: d.feedback,
      }));
      setDiaries(mapped);
    } catch (err: any) {
      message.error(err.message || 'Failed to load work diaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDiaries();
  }, []);

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
        <Table columns={columns} dataSource={diaries} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  );
};

export default WorkDiary;
