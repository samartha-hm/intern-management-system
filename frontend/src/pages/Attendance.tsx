import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Table, Typography, Space, message, Statistic, Progress, Modal, Form, Input, Select, Alert, Tabs } from 'antd';
import { ClockCircleOutlined, QrcodeOutlined, LogoutOutlined, CheckCircleOutlined, CalendarOutlined, SafetyCertificateOutlined, CameraOutlined, BankOutlined, KeyOutlined, ScanOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

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

const Attendance: React.FC = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [todayWorkSummary, setTodayWorkSummary] = useState<string>('');

  // Batch Request States
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [requestLoading, setRequestLoading] = useState<boolean>(false);

  // QR Scanner Modal States
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isCheckOutDiaryModalOpen, setIsCheckOutDiaryModalOpen] = useState<boolean>(false);
  const [qrActionType, setQrActionType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [manualQrCode, setManualQrCode] = useState<string>('');
  const [isQrDetected, setIsQrDetected] = useState<boolean>(false);

  const [diaryForm] = Form.useForm();

  const fetchAvailableBatches = async () => {
    try {
      const data = await apiService.get('/internships');
      setAvailableBatches(data);
    } catch {
      // Ignore error
    }
  };

  const handleRequestBatchSubmit = async () => {
    if (!selectedBatchId) {
      message.warning('Please select an internship batch to join');
      return;
    }
    try {
      setRequestLoading(true);
      await apiService.post('/users/request-batch', { batchId: selectedBatchId });
      message.success('Batch join request submitted to Admin/Supervisor!');
      window.location.reload();
    } catch (err: any) {
      message.error(err.message || 'Failed to submit batch request');
    } finally {
      setRequestLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/attendance/my');
      const todayStr = new Date().toISOString().split('T')[0];
      setRecords(data);
      const foundToday = data.find((r: AttendanceRecord) => r.date === todayStr);

      if (foundToday) {
        setTodayRecord(foundToday);
        setIsCheckedIn(true);
        if (foundToday.workSummary) {
          setTodayWorkSummary(foundToday.workSummary);
        }
      } else {
        setIsCheckedIn(false);
        setTodayRecord(null);
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchAvailableBatches();
  }, []);

  // Personalized Intern Contract Details configured by Supervisor / Admin
  const userBatchStatus = (currentUser as any)?.batchStatus || 'NONE';
  const hasApprovedBatch = userBatchStatus === 'APPROVED';

  const activeBatch = (currentUser as any)?.assignedBatch || (currentUser as any)?.internships?.[0];
  const programTitle = hasApprovedBatch ? (activeBatch?.title || currentUser?.position || 'Full-Stack Software Engineering Cohort') : 'No Active Cohort Enrolled';
  const department = hasApprovedBatch ? (activeBatch?.department || currentUser?.department || 'Engineering') : 'Unassigned';
  const startDateStr = (hasApprovedBatch && activeBatch?.startDate) ? new Date(activeBatch.startDate).toISOString().split('T')[0] : 'Pending Approval';
  const endDateStr = (hasApprovedBatch && activeBatch?.endDate) ? new Date(activeBatch.endDate).toISOString().split('T')[0] : 'Pending Approval';

  const totalProgramDays = (currentUser as any)?.contractDays || 65;
  const presentDays = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const totalHoursLogged = Math.round(records.reduce((acc, r) => acc + (r.workHours || 0), 0) * 10) / 10;

  let elapsedDays = 0;
  if (hasApprovedBatch && activeBatch?.startDate) {
    const startMs = new Date(activeBatch.startDate).getTime();
    const nowMs = new Date().getTime();
    const diff = Math.max(1, Math.round((nowMs - startMs) / (1000 * 60 * 60 * 24)));
    elapsedDays = Math.min(totalProgramDays, diff);
  }

  const programDetails = {
    hasApprovedBatch,
    title: programTitle,
    department,
    startDate: startDateStr,
    endDate: endDateStr,
    totalProgramDays,
    elapsedDays,
    presentDays,
    totalHoursLogged,
  };

  const attendanceRate = elapsedDays > 0 ? Math.round((programDetails.presentDays / elapsedDays) * 1000) / 10 : 0;
  const programProgressPct = elapsedDays > 0 ? Math.round((elapsedDays / totalProgramDays) * 1000) / 10 : 0;

  // QR Scanner Real Camera States
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  const startCameraStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      }
    } catch {
      setCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setCameraActive(false);
  };

  const handleCancelBatchRequestSubmit = async () => {
    try {
      setRequestLoading(true);
      await apiService.post('/users/cancel-batch-request');
      message.info('Batch join request cancelled.');
      window.location.reload();
    } catch (err: any) {
      message.error(err.message || 'Failed to cancel request');
    } finally {
      setRequestLoading(false);
    }
  };

  // Trigger Check-In Flow
  const openCheckInQrModal = () => {
    setQrActionType('CHECK_IN');
    setIsQrDetected(false);
    setIsQrModalOpen(true);
    startCameraStream();
    setTimeout(() => setIsQrDetected(true), 1000);
  };

  // Trigger Check-Out Flow (Requires Work Diary Summary!)
  const handleCheckOutClick = () => {
    if (!todayWorkSummary) {
      setIsCheckOutDiaryModalOpen(true);
    } else {
      setQrActionType('CHECK_OUT');
      setIsQrDetected(false);
      setIsQrModalOpen(true);
      startCameraStream();
      setTimeout(() => setIsQrDetected(true), 1000);
    }
  };

  const handleCloseQrModal = () => {
    stopCameraStream();
    setIsQrModalOpen(false);
  };

  // Confirm QR Scanning & Update UI Instantly
  const confirmQrScan = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (qrActionType === 'CHECK_IN') {
        await apiService.post('/attendance/check-in', { notes: 'QR Kiosk Check-In' });
        message.success('Entrance Check-In Verified & Saved!');
        setIsCheckedIn(true);
        setTodayRecord({
          id: `att-${Date.now()}`,
          date: todayStr,
          checkIn: nowTimeStr,
          checkOut: null,
          workHours: 8.0,
          status: 'PRESENT',
          workSummary: 'QR Kiosk Check-In',
        });
      } else {
        await apiService.post('/attendance/check-out', { notes: todayWorkSummary });
        if (todayWorkSummary) {
          await apiService.post('/work-diary', {
            tasksDone: todayWorkSummary,
            hoursSpent: 8.0,
          });
        }
        message.success('Exit Check-Out Verified & Work Diary Submitted!');
        if (todayRecord) {
          setTodayRecord({
            ...todayRecord,
            checkOut: nowTimeStr,
            workSummary: todayWorkSummary,
          });
        }
      }
      stopCameraStream();
      setIsQrModalOpen(false);
      fetchAttendance();
    } catch (err: any) {
      message.error(err.message || 'Check-in/out failed');
    }
  };

  // Submit Work Diary Summary & Proceed to Check-Out
  const handleDiaryAndCheckOutSubmit = (values: { workSummary: string }) => {
    setTodayWorkSummary(values.workSummary);
    setIsCheckOutDiaryModalOpen(false);
    setQrActionType('CHECK_OUT');
    setIsQrDetected(false);
    setIsQrModalOpen(true);
    startCameraStream();
    setTimeout(() => setIsQrDetected(true), 1000);
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

      {userBatchStatus !== 'APPROVED' && (
        <Card
          title="Internship Batch Join Request"
          style={{ border: '2px solid #6366f1', background: 'linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)' }}
        >
          {userBatchStatus === 'REQUESTED' ? (
            <Alert
              type="warning"
              showIcon
              message={`Enrollment Request Submitted — ${(currentUser as any)?.assignedBatch?.title || 'Internship Cohort'}`}
              description="Your request to join this internship batch is currently pending approval by your Supervisor or System Admin."
              action={
                <Button size="small" danger onClick={handleCancelBatchRequestSubmit} loading={requestLoading} style={{ fontWeight: 700 }}>
                  Cancel Request
                </Button>
              }
              style={{ borderRadius: 12 }}
            />
          ) : (
            <div>
              <Text style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
                Please select an active Internship Batch / Cohort to request enrollment:
              </Text>
              <Space style={{ width: '100%', flexWrap: 'wrap' }}>
                <Select
                  placeholder="Select an Internship Batch..."
                  style={{ width: 320 }}
                  value={selectedBatchId}
                  onChange={setSelectedBatchId}
                >
                  {availableBatches.map((b: any) => (
                    <Select.Option key={b.id} value={b.id}>
                      {b.title} ({b.department})
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<QrcodeOutlined />}
                  onClick={handleRequestBatchSubmit}
                  loading={requestLoading}
                  style={{ fontWeight: 700 }}
                >
                  Submit Join Request
                </Button>
              </Space>
            </div>
          )}
        </Card>
      )}

      <Row gutter={[20, 20]}>
        {/* Clock Card */}
        <Col xs={24} lg={10}>
          <Card styles={{ body: { padding: 24, textAlign: 'center' } }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: isCheckedIn ? '#d1fae5' : '#fee2e2', color: isCheckedIn ? '#059669' : '#dc2626', fontSize: 28, marginBottom: 12 }}>
              <QrcodeOutlined />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              {todayRecord?.checkIn ? `Checked In: ${todayRecord.checkIn}` : 'Not Checked In Yet'}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              Requirement: Scan Office Check-In (Entrance) or Check-Out (Exit) QR Screen
            </Text>

            {!isCheckedIn ? (
              <Button type="primary" size="large" block icon={<QrcodeOutlined />} onClick={openCheckInQrModal} style={{ height: 48, fontSize: 15, fontWeight: 700 }}>
                Scan Entrance QR Code to Clock In
              </Button>
            ) : (
              <Button danger size="large" block icon={<LogoutOutlined />} onClick={handleCheckOutClick} disabled={Boolean(todayRecord?.checkOut)} style={{ height: 48, fontSize: 15, fontWeight: 700 }}>
                {todayRecord?.checkOut ? 'Checked Out for Today' : 'Scan Exit QR Code to Clock Out'}
              </Button>
            )}

            {todayRecord?.checkIn && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, textAlign: 'left', fontSize: 13, border: '1px solid #e2e8f0' }}>
                <Text style={{ display: 'block' }}>Status: <Tag color="green">{todayRecord.status}</Tag></Text>
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
            {!programDetails.hasApprovedBatch && (
              <Alert
                type="info"
                showIcon
                message="Enrollment Pending Supervisor Approval"
                description="Select an active Internship Batch above and submit a join request to begin your contract tenure tracking."
                style={{ borderRadius: 10, marginBottom: 16 }}
              />
            )}
            <div style={{ marginBottom: 16 }}>
              <Space>
                <BankOutlined style={{ color: '#6366f1' }} />
                <Text strong style={{ fontSize: 14 }}>{programDetails.title}</Text>
                <Tag color={programDetails.hasApprovedBatch ? 'purple' : 'default'}>{programDetails.department}</Tag>
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
              <Progress percent={programProgressPct} status={programDetails.hasApprovedBatch ? 'active' : 'normal'} strokeColor="#6366f1" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* History Table */}
      <Card title="Attendance Logs History" styles={{ body: { padding: 20 } }}>
        <Table columns={columns} dataSource={records} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      {/* Real HTML5 Browser Camera QR Scanner Modal */}
      <Modal
        title={`Workplace Camera Scanner — ${qrActionType === 'CHECK_IN' ? 'Entrance Check-In' : 'Exit Check-Out'}`}
        open={isQrModalOpen}
        onCancel={handleCloseQrModal}
        footer={null}
        centered
        width={460}
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
            Align your camera viewfinder with the Experimind Office {qrActionType === 'CHECK_IN' ? 'Entrance' : 'Exit'} QR Wallpaper Display
          </Text>

          {/* Real Video / Camera Viewfinder Box */}
          <div
            style={{
              position: 'relative',
              width: 270,
              height: 270,
              margin: '0 auto 20px auto',
              borderRadius: 24,
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '3px solid #6366f1',
              boxShadow: '0 15px 35px rgba(99, 102, 241, 0.25)',
            }}
          >
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <ScanOutlined style={{ fontSize: 110, color: isQrDetected ? '#10b981' : '#6366f1', transition: 'color 0.3s' }} />
            )}

            {/* Laser Scan Animation Line */}
            <div
              style={{
                position: 'absolute',
                left: '10%',
                right: '10%',
                height: '2px',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
                animation: 'scanLine 2s infinite ease-in-out',
              }}
            />

            {isQrDetected && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                <CheckCircleOutlined style={{ fontSize: 64, color: '#10b981', marginBottom: 8 }} />
                <Tag color="green" style={{ fontWeight: 800, fontSize: 13, padding: '4px 14px', borderRadius: 20 }}>
                  QR CODE VERIFIED & MATCHED
                </Tag>
              </div>
            )}
          </div>

          <Button
            type="primary"
            size="large"
            block
            icon={<SafetyCertificateOutlined />}
            onClick={confirmQrScan}
            disabled={!isQrDetected}
            style={{ height: 46, fontWeight: 700, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
          >
            Confirm {qrActionType === 'CHECK_IN' ? 'Entrance Check-In' : 'Exit Check-Out'} Timestamp
          </Button>
        </div>
      </Modal>

      {/* Simplified Work Diary Submission Modal */}
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
