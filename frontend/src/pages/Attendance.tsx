import React, { useState } from 'react';
import { Card, Row, Col, Button, Tag, Table, Typography, Space, message, Statistic, Progress, Modal, Form, Input } from 'antd';
import { ClockCircleOutlined, QrcodeOutlined, LogoutOutlined, CheckCircleOutlined, CalendarOutlined, SafetyCertificateOutlined, CameraOutlined, BankOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workHours: number | null;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE';
  workSummary?: string;
}

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: '1', date: '2026-08-06', checkIn: '09:15 AM', checkOut: null, workHours: null, status: 'PRESENT' },
  { id: '2', date: '2026-08-05', checkIn: '09:42 AM', checkOut: '05:30 PM', workHours: 7.8, status: 'LATE', workSummary: 'Implemented UI design system components and responsive grid layouts.' },
  { id: '3', date: '2026-08-04', checkIn: '09:05 AM', checkOut: '05:30 PM', workHours: 8.4, status: 'PRESENT', workSummary: 'Fixed Prisma client relationship models and database seed scripts.' },
  { id: '4', date: '2026-08-03', checkIn: '09:10 AM', checkOut: '05:30 PM', workHours: 8.3, status: 'PRESENT', workSummary: 'Created Express API controllers for document uploads and file security.' },
  { id: '5', date: '2026-08-01', checkIn: '09:00 AM', checkOut: '01:30 PM', workHours: 4.5, status: 'HALF_DAY', workSummary: 'Attended weekly sprint planning and code review.' },
];

const Attendance: React.FC = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord>(INITIAL_ATTENDANCE[0]);
  const [todayWorkSummary, setTodayWorkSummary] = useState<string>('');

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isCheckOutDiaryModalOpen, setIsCheckOutDiaryModalOpen] = useState<boolean>(false);
  const [qrActionType, setQrActionType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [isQrDetected, setIsQrDetected] = useState<boolean>(false);

  const [diaryForm] = Form.useForm();

  // Personalized Intern Contract Details
  const totalProgramDays = currentUser?.totalProgramDays || 65;
  const programDetails = {
    title: 'Full-Stack Software Engineering Cohort',
    department: currentUser?.department || 'Engineering',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    totalProgramDays: totalProgramDays,
    elapsedDays: Math.min(45, totalProgramDays),
    presentDays: Math.min(43, totalProgramDays),
    lateDays: 2,
    totalHoursLogged: 164,
  };

  const attendanceRate = Math.round((programDetails.presentDays / programDetails.elapsedDays) * 1000) / 10;
  const programProgressPct = Math.round((programDetails.elapsedDays / programDetails.totalProgramDays) * 1000) / 10;

  // Trigger Check-In Flow
  const openCheckInQrModal = () => {
    setQrActionType('CHECK_IN');
    setIsQrDetected(false);
    setIsQrModalOpen(true);
    setTimeout(() => setIsQrDetected(true), 1200);
  };

  // Trigger Check-Out Flow (Requires Work Diary Summary!)
  const handleCheckOutClick = () => {
    if (!todayWorkSummary) {
      setIsCheckOutDiaryModalOpen(true);
    } else {
      setQrActionType('CHECK_OUT');
      setIsQrDetected(false);
      setIsQrModalOpen(true);
      setTimeout(() => setIsQrDetected(true), 1200);
    }
  };

  // Confirm QR Scanning
  const confirmQrScan = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (qrActionType === 'CHECK_IN') {
      const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
      const newRecord: AttendanceRecord = {
        id: String(Date.now()),
        date: new Date().toISOString().split('T')[0],
        checkIn: timeStr,
        checkOut: null,
        workHours: null,
        status: isLate ? 'LATE' : 'PRESENT',
      };
      setTodayRecord(newRecord);
      setIsCheckedIn(true);
      setRecords([newRecord, ...records.filter((r) => r.date !== newRecord.date)]);
      message.success('Entrance Check-In QR Scanned & Verified!');
    } else {
      const updated = {
        ...todayRecord,
        checkOut: timeStr,
        workHours: 8.0,
        workSummary: todayWorkSummary,
      };
      setTodayRecord(updated);
      setIsCheckedIn(false);
      setRecords(records.map((r) => (r.id === todayRecord.id ? updated : r)));
      message.success('Exit Check-Out QR Scanned & Work Summary Logged!');
    }
    setIsQrModalOpen(false);
  };

  // Submit Work Diary Summary & Proceed to Check-Out
  const handleDiaryAndCheckOutSubmit = (values: { workSummary: string }) => {
    setTodayWorkSummary(values.workSummary);
    setIsCheckOutDiaryModalOpen(false);
    setQrActionType('CHECK_OUT');
    setIsQrDetected(false);
    setIsQrModalOpen(true);
    setTimeout(() => setIsQrDetected(true), 1200);
  };

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
      title: 'Check-In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (t: string) => <Tag icon={<ClockCircleOutlined />} color="blue">{t}</Tag>,
    },
    {
      title: 'Check-Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (t: string | null) => (t ? <Tag icon={<ClockCircleOutlined />} color="purple">{t}</Tag> : <Text type="secondary">In Progress...</Text>),
    },
    {
      title: 'Work Hours',
      dataIndex: 'workHours',
      key: 'workHours',
      render: (h: number | null) => (h ? <Text strong style={{ color: '#059669' }}>{h} hrs</Text> : '-'),
    },
    {
      title: 'Work Summary',
      dataIndex: 'workSummary',
      key: 'workSummary',
      render: (summary?: string) => (summary ? <Text type="secondary" style={{ fontSize: 12 }}>{summary}</Text> : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = { PRESENT: 'green', LATE: 'gold', HALF_DAY: 'orange', ABSENT: 'red', ON_LEAVE: 'blue' };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Office QR Attendance Clock</Title>
        <Text type="secondary">Scan Entrance / Exit Office QR wallpapers to clock in and out daily</Text>
      </div>

      <Row gutter={[20, 20]}>
        {/* Clock Card */}
        <Col xs={24} lg={10}>
          <Card styles={{ body: { padding: 24, textAlign: 'center' } }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: isCheckedIn ? '#d1fae5' : '#fee2e2', color: isCheckedIn ? '#059669' : '#dc2626', fontSize: 28, marginBottom: 12 }}>
              <QrcodeOutlined />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              {todayRecord.checkIn ? `Checked In: ${todayRecord.checkIn}` : 'Not Checked In Yet'}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              Requirement: Scan Office Check-In (Entrance) or Check-Out (Exit) QR Screen
            </Text>

            {!isCheckedIn ? (
              <Button type="primary" size="large" block icon={<QrcodeOutlined />} onClick={openCheckInQrModal} style={{ height: 48, fontSize: 15, fontWeight: 700 }}>
                Scan Entrance QR Code to Clock In
              </Button>
            ) : (
              <Button danger size="large" block icon={<LogoutOutlined />} onClick={handleCheckOutClick} disabled={Boolean(todayRecord.checkOut)} style={{ height: 48, fontSize: 15, fontWeight: 700 }}>
                {todayRecord.checkOut ? 'Checked Out for Today' : 'Scan Exit QR Code to Clock Out'}
              </Button>
            )}

            {todayRecord.checkIn && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, textAlign: 'left', fontSize: 13, border: '1px solid #e2e8f0' }}>
                <Text style={{ display: 'block' }}>Status: <Tag color={todayRecord.status === 'LATE' ? 'gold' : 'green'}>{todayRecord.status}</Tag></Text>
                <Text style={{ display: 'block', marginTop: 4 }}>
                  Work Summary: {todayWorkSummary ? <Tag color="green">LOGGED</Tag> : <Tag color="orange">REQUIRED AT CHECK-OUT</Tag>}
                </Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Personalized Intern Tenure & Program Attendance Summary Card */}
        <Col xs={24} lg={14}>
          <Card title="My Internship Program & Tenure Progress" styles={{ body: { padding: 20 } }}>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <BankOutlined style={{ color: '#6366f1' }} />
                <Text strong style={{ fontSize: 14 }}>{programDetails.title}</Text>
                <Tag color="purple">{programDetails.department}</Tag>
              </Space>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Contract Duration: {programDetails.startDate} to {programDetails.endDate} ({programDetails.totalProgramDays} Days Total)
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic title="Program Days Elapsed" value={programDetails.elapsedDays} suffix={`/ ${programDetails.totalProgramDays}`} valueStyle={{ color: '#4f46e5', fontWeight: 800 }} />
              </Col>
              <Col span={8}>
                <Statistic title="My Attendance Rate" value={attendanceRate} suffix="%" valueStyle={{ color: '#059669', fontWeight: 800 }} />
              </Col>
              <Col span={8}>
                <Statistic title="Total Hours Logged" value={programDetails.totalHoursLogged} suffix="hrs" valueStyle={{ color: '#9333ea', fontWeight: 800 }} />
              </Col>
            </Row>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <Text strong>Program Tenure Progress</Text>
                <Text type="secondary">{programDetails.elapsedDays} of {programDetails.totalProgramDays} Days Completed ({programProgressPct}%)</Text>
              </div>
              <Progress percent={programProgressPct} status="active" strokeColor="#6366f1" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* History Table */}
      <Card title="Attendance Logs History" styles={{ body: { padding: 20 } }}>
        <Table columns={columns} dataSource={records} rowKey="id" pagination={{ pageSize: 7 }} />
      </Card>

      {/* Camera Viewfinder QR Scanner Modal */}
      <Modal
        title={`Camera Viewfinder — ${qrActionType === 'CHECK_IN' ? 'Entrance Check-In' : 'Exit Check-Out'}`}
        open={isQrModalOpen}
        onCancel={() => setIsQrModalOpen(false)}
        footer={null}
        centered
        width={440}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
            <CameraOutlined style={{ marginRight: 6 }} />
            Align camera viewfinder with the Experimind Labs Office {qrActionType === 'CHECK_IN' ? 'Entrance' : 'Exit'} QR Code
          </Text>

          {/* Viewfinder Box */}
          <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto 20px auto', borderRadius: 20, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid #6366f1', boxShadow: '0 12px 30px rgba(0,0,0,0.25)' }}>
            <QrcodeOutlined style={{ fontSize: 110, color: isQrDetected ? '#10b981' : '#475569', transition: 'color 0.3s' }} />

            {isQrDetected && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 56, color: '#10b981' }} />
              </div>
            )}
          </div>

          <Button type="primary" size="large" block icon={<SafetyCertificateOutlined />} onClick={confirmQrScan} disabled={!isQrDetected} style={{ height: 44, fontWeight: 700 }}>
            Confirm {qrActionType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} Timestamp
          </Button>
        </div>
      </Modal>

      {/* Simplified Work Diary Submission Modal (Clean, no blue alert box!) */}
      <Modal
        title="Work Diary Entry Required Before Check-Out"
        open={isCheckOutDiaryModalOpen}
        onCancel={() => setIsCheckOutDiaryModalOpen(false)}
        onOk={() => diaryForm.submit()}
        okText="Submit Summary & Scan Exit QR Code"
        width={480}
      >
        <Form form={diaryForm} layout="vertical" onFinish={handleDiaryAndCheckOutSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="workSummary" label={<span style={{ fontWeight: 700, fontSize: 14 }}>Today's Work Summary</span>} rules={[{ required: true, message: 'Please enter today\'s work summary' }]}>
            <TextArea rows={4} placeholder="Enter your work accomplishments or summary for today..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Attendance;
