import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Table, Typography, Space, message, Statistic, Progress, Modal, Form, Input, Select, Alert } from 'antd';
import { ClockCircleOutlined, QrcodeOutlined, LogoutOutlined, CheckCircleOutlined, CalendarOutlined, SafetyCertificateOutlined, BankOutlined, ScanOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../redux/slices/authSlice';
import type { AppDispatch } from '../redux/store';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { Html5Qrcode } from 'html5-qrcode';

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
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [todayWorkSummary, setTodayWorkSummary] = useState<string>('');
  const [todayHoursSpent, setTodayHoursSpent] = useState<number>(8.0);

  // Batch Request States
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [requestLoading, setRequestLoading] = useState<boolean>(false);

  // QR Scanner Modal States
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isCheckOutDiaryModalOpen, setIsCheckOutDiaryModalOpen] = useState<boolean>(false);
  const [qrActionType, setQrActionType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
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
      dispatch(fetchCurrentUser());
    } catch (err: any) {
      message.error(err.message || 'Failed to submit batch request');
    } finally {
      setRequestLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      dispatch(fetchCurrentUser());
      const data = await apiService.get('/attendance/my');
      const todayStr = new Date().toISOString().split('T')[0];

      const mapped: AttendanceRecord[] = (Array.isArray(data) ? data : []).map((r: any) => ({
        id: r.id,
        date: r.date ? new Date(r.date).toISOString().split('T')[0] : (r.checkInTime ? new Date(r.checkInTime).toISOString().split('T')[0] : todayStr),
        checkIn: r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        checkOut: r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        workHours: r.workHours || null,
        status: r.status,
        workSummary: r.notes || '',
      }));

      setRecords(mapped);

      const foundToday = mapped.find((r: AttendanceRecord) => r.date === todayStr);

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
  const activeBatch = (currentUser as any)?.assignedBatch || (currentUser as any)?.internships?.[0];
  const rawBatchStatus = (currentUser as any)?.batchStatus || 'NONE';
  const hasApprovedBatch = rawBatchStatus === 'APPROVED' || Boolean((currentUser as any)?.assignedBatchId) || Boolean(activeBatch);
  const userBatchStatus = hasApprovedBatch ? 'APPROVED' : rawBatchStatus;

  let programTitle = 'No Active Cohort Enrolled';
  let department = 'Unassigned';
  let startDateStr = 'Not Enrolled';
  let endDateStr = 'Not Enrolled';

  if (hasApprovedBatch) {
    programTitle = activeBatch?.title || currentUser?.position || 'Software Engineering Internship';
    department = activeBatch?.department || currentUser?.department || 'Engineering';
    startDateStr = activeBatch?.startDate ? new Date(activeBatch.startDate).toISOString().split('T')[0] : 'Assigned';
    endDateStr = activeBatch?.endDate ? new Date(activeBatch.endDate).toISOString().split('T')[0] : 'Assigned';
  } else if (userBatchStatus === 'REQUESTED' || userBatchStatus === 'PENDING') {
    programTitle = activeBatch ? `${activeBatch.title} (Enrollment Pending)` : 'Batch Request Pending Approval';
    department = activeBatch?.department || currentUser?.department || 'Engineering';
    startDateStr = 'Pending Approval';
    endDateStr = 'Pending Approval';
  }

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
  const html5QrCodeRef = React.useRef<Html5Qrcode | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [scannedQrContent, setScannedQrContent] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanTab, setScanTab] = useState<'CAMERA' | 'FILE'>('CAMERA');

  // Confirm QR Scanning & Update UI Instantly
  const confirmQrScan = async (overrideContent?: string) => {
    const contentToUse = overrideContent || scannedQrContent;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let nonceToSend: string | undefined = undefined;
      if (contentToUse) {
        try {
          const parsed = JSON.parse(contentToUse);
          nonceToSend = parsed.nonce || contentToUse;
        } catch {
          nonceToSend = contentToUse;
        }
      }

      if (qrActionType === 'CHECK_IN') {
        await apiService.post('/attendance/check-in', { notes: 'QR Kiosk Check-In', nonce: nonceToSend });
        message.success('Entrance Check-In Verified & Saved!');
        setIsCheckedIn(true);
        setTodayRecord({
          id: `att-${Date.now()}`,
          date: todayStr,
          checkIn: nowTimeStr,
          checkOut: null,
          workHours: 8.0,
          status: 'PRESENT',
          workSummary: '',
        });
      } else {
        if (!todayWorkSummary || todayWorkSummary.trim().length === 0) {
          message.warning('Mandatory Work Diary entry required before checking out.');
          handleCloseQrModal();
          setIsCheckOutDiaryModalOpen(true);
          return;
        }
        await apiService.post('/attendance/check-out', { notes: todayWorkSummary, nonce: nonceToSend });
        await apiService.post('/work-diary', {
          tasksDone: todayWorkSummary,
          hoursSpent: todayHoursSpent || 8.0,
          date: todayStr,
        }).catch(() => {});

        message.success('Exit Check-Out Verified & Work Diary Saved!');
        setTodayRecord((prev) => (prev ? { ...prev, checkOut: nowTimeStr, workSummary: todayWorkSummary } : null));
      }
      handleCloseQrModal();
      fetchAttendance();
    } catch (err: any) {
      message.error(err.message || 'Check-in/out failed');
    }
  };

  const startQrScanner = async (cameraIdOverride?: string) => {
    setIsQrDetected(false);
    setScannedQrContent('');
    setCameraActive(false);

    setTimeout(async () => {
      try {
        const qrContainer = document.getElementById('html5-qr-reader');
        if (!qrContainer) return;

        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
            html5QrCodeRef.current.clear();
          } catch {}
        }

        const html5QrCode = new Html5Qrcode('html5-qr-reader');
        html5QrCodeRef.current = html5QrCode;

        // Discover available camera devices
        let cameras: any[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras.map((c: any, index: number) => ({
              id: c.id,
              label: c.label || `Camera ${index + 1} (${c.id.substring(0, 4)}...)`,
            })));
          }
        } catch {
          // Camera listing failed or blocked
        }

        const targetCameraId = cameraIdOverride || selectedCameraId || (cameras.length > 0 ? cameras[0].id : null);
        const cameraConfig = targetCameraId
          ? { deviceId: { exact: targetCameraId } }
          : { facingMode: 'environment' };

        const onScanSuccess = (decodedText: string) => {
          setIsQrDetected(true);
          setScannedQrContent(decodedText);
          message.success('QR Code Verified & Matched!');
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          html5QrCode.stop().catch(() => {});
          // Auto confirm scan instantly!
          confirmQrScan(decodedText);
        };

        try {
          await html5QrCode.start(
            cameraConfig,
            { fps: 15, qrbox: { width: 220, height: 220 } },
            onScanSuccess,
            () => {}
          );
          setCameraActive(true);
        } catch {
          // Fallback to front camera if environment fails
          await html5QrCode.start(
            { facingMode: 'user' },
            { fps: 15, qrbox: { width: 220, height: 220 } },
            onScanSuccess,
            () => {}
          );
          setCameraActive(true);
        }
      } catch (err: any) {
        setCameraActive(false);
      }
    }, 300);
  };

  const stopQrScanner = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
          html5QrCodeRef.current = null;
        }).catch(() => {});
      } catch {
        // Ignore
      }
    }
    setCameraActive(false);
  };

  const handleQrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const html5QrCode = new Html5Qrcode('html5-qr-reader-file-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      setIsQrDetected(true);
      setScannedQrContent(decodedText);
      message.success('QR Image File Decoded Successfully!');
      confirmQrScan(decodedText);
    } catch (err: any) {
      message.error('Could not detect QR code in uploaded image. Please ensure image is clear.');
    }
  };

  const handleCancelBatchRequestSubmit = async () => {
    try {
      setRequestLoading(true);
      await apiService.post('/users/cancel-batch-request');
      message.info('Batch join request cancelled.');
      dispatch(fetchCurrentUser());
    } catch (err: any) {
      message.error(err.message || 'Failed to cancel request');
    } finally {
      setRequestLoading(false);
    }
  };

  // Trigger Check-In Flow
  const openCheckInQrModal = () => {
    setQrActionType('CHECK_IN');
    setIsQrModalOpen(true);
    setScanTab('CAMERA');
    startQrScanner();
  };

  // Trigger Check-Out Flow (ALWAYS requires Work Diary entry first!)
  const handleCheckOutClick = () => {
    setIsCheckOutDiaryModalOpen(true);
  };

  const handleCloseQrModal = () => {
    stopQrScanner();
    setIsQrModalOpen(false);
  };

  // Submit Work Diary Summary & Proceed to Check-Out
  const handleDiaryAndCheckOutSubmit = (values: { workSummary: string; hoursSpent?: number }) => {
    setTodayWorkSummary(values.workSummary);
    setTodayHoursSpent(values.hoursSpent ? Number(values.hoursSpent) : 8.0);
    setIsCheckOutDiaryModalOpen(false);
    setQrActionType('CHECK_OUT');
    setIsQrModalOpen(true);
    startQrScanner();
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
              message={<span style={{ fontWeight: 800, fontSize: 15 }}>Enrollment Request Submitted — Pending Approval</span>}
              description={
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    Requested Internship Cohort: <strong>{activeBatch?.title || 'Internship Program'}</strong>
                  </div>
                  <div>
                    Department: <Tag color="blue">{activeBatch?.department || currentUser?.department || 'Engineering'}</Tag>
                  </div>
                  {activeBatch?.mentor && (
                    <div>
                      Assigned Supervisor / Mentor: <strong>{activeBatch.mentor.firstName} {activeBatch.mentor.lastName}</strong> ({activeBatch.mentor.email})
                    </div>
                  )}
                  <div style={{ color: '#d97706', fontSize: 13, marginTop: 4, fontWeight: 600 }}>
                    ⏳ Your request to join this cohort is currently pending review by your Supervisor or System Admin. Attendance scanning will unlock automatically upon approval.
                  </div>
                </div>
              }
              action={
                <Button danger onClick={handleCancelBatchRequestSubmit} loading={requestLoading} style={{ fontWeight: 700, marginTop: 6 }}>
                  Cancel Request
                </Button>
              }
              style={{ borderRadius: 14 }}
            />
          ) : (
            <div>
              <Text style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
                Please select an active Internship Batch / Cohort to request enrollment:
              </Text>
              <Space style={{ width: '100%', flexWrap: 'wrap' }}>
                <Select
                  placeholder="Select an Internship Batch..."
                  style={{ width: 340 }}
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
              <Button
                type="primary"
                size="large"
                block
                icon={<QrcodeOutlined />}
                onClick={openCheckInQrModal}
                disabled={!hasApprovedBatch}
                style={{ height: 48, fontSize: 15, fontWeight: 700 }}
              >
                Scan Entrance QR Code to Clock In
              </Button>
            ) : (
              <Button
                danger
                size="large"
                block
                icon={<LogoutOutlined />}
                onClick={handleCheckOutClick}
                disabled={!hasApprovedBatch || Boolean(todayRecord?.checkOut)}
                style={{ height: 48, fontSize: 15, fontWeight: 700 }}
              >
                {todayRecord?.checkOut ? 'Checked Out for Today' : 'Scan Exit QR Code to Clock Out'}
              </Button>
            )}

            {!hasApprovedBatch && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#fffbe6', borderRadius: 10, border: '1px solid #ffe58f', textAlign: 'center', fontSize: 13, color: '#d97706', fontWeight: 600 }}>
                🔒 Attendance Scanning Locked
                <div style={{ fontSize: 12, fontWeight: 400, color: '#78350f', marginTop: 4 }}>
                  {userBatchStatus === 'REQUESTED'
                    ? 'Your batch enrollment request is pending supervisor approval. Attendance QR clocking will unlock automatically once approved.'
                    : 'Please select an active Internship Batch above and submit a join request to unlock attendance clocking.'}
                </div>
              </div>
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
                type={userBatchStatus === 'REQUESTED' ? 'warning' : 'info'}
                showIcon
                message={userBatchStatus === 'REQUESTED' ? 'Enrollment Pending Supervisor Approval' : 'Cohort Enrollment Required'}
                description={
                  userBatchStatus === 'REQUESTED'
                    ? `You have requested enrollment in "${activeBatch?.title || 'Internship Cohort'}". Your contract tenure tracking will start once approved.`
                    : 'Select an active Internship Batch above and submit a join request to begin your contract tenure tracking.'
                }
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

      {/* Enhanced Multi-Mode HTML5 Browser Camera & Image QR Scanner Modal */}
      <Modal
        title={`Workplace QR Scanner — ${qrActionType === 'CHECK_IN' ? 'Entrance Check-In' : 'Exit Check-Out'}`}
        open={isQrModalOpen}
        onCancel={handleCloseQrModal}
        footer={null}
        centered
        width={480}
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          {/* Hidden helper for file scanning */}
          <div id="html5-qr-reader-file-temp" style={{ display: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <Button
              type={scanTab === 'CAMERA' ? 'primary' : 'default'}
              size="small"
              icon={<ScanOutlined />}
              onClick={() => {
                setScanTab('CAMERA');
                startQrScanner();
              }}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Live Camera
            </Button>
            <Button
              type={scanTab === 'FILE' ? 'primary' : 'default'}
              size="small"
              icon={<QrcodeOutlined />}
              onClick={() => {
                setScanTab('FILE');
                stopQrScanner();
              }}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Upload QR Image
            </Button>
          </div>

          {scanTab === 'CAMERA' ? (
            <>
              {availableCameras.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, marginRight: 8, color: '#64748b' }}>Switch Camera:</Text>
                  <Select
                    size="small"
                    style={{ width: 220 }}
                    value={selectedCameraId || (availableCameras[0]?.id || '')}
                    onChange={(val) => {
                      setSelectedCameraId(val);
                      startQrScanner(val);
                    }}
                  >
                    {availableCameras.map((c) => (
                      <Select.Option key={c.id} value={c.id}>
                        {c.label}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Real Video / Camera Viewfinder Box */}
              <div
                style={{
                  position: 'relative',
                  width: 300,
                  height: 250,
                  margin: '0 auto 16px auto',
                  borderRadius: 20,
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '3px solid #6366f1',
                  boxShadow: '0 15px 35px rgba(99, 102, 241, 0.25)',
                }}
              >
                <div id="html5-qr-reader" style={{ width: '100%', height: '100%' }} />

                {!cameraActive && !isQrDetected && (
                  <div style={{ padding: 20, textAlign: 'center', position: 'absolute' }}>
                    <ScanOutlined style={{ fontSize: 54, color: '#6366f1', marginBottom: 10 }} />
                    <Text style={{ color: '#94a3b8', display: 'block', fontSize: 12 }}>
                      Initializing camera viewfinder...
                    </Text>
                  </div>
                )}

                {isQrDetected && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <CheckCircleOutlined style={{ fontSize: 64, color: '#ffffff', marginBottom: 8 }} />
                    <Tag color="green" style={{ fontWeight: 800, fontSize: 13, padding: '4px 14px', borderRadius: 20, background: '#ffffff', color: '#059669', border: 'none' }}>
                      QR VERIFIED — CLOCKING IN...
                    </Tag>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '24px 16px', background: '#f8fafc', borderRadius: 16, border: '2px dashed #cbd5e1', marginBottom: 16 }}>
              <QrcodeOutlined style={{ fontSize: 48, color: '#6366f1', marginBottom: 12 }} />
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Upload QR Wallpaper Screenshot / Image</Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
                Select a saved photo or screenshot of the Office Entrance/Exit QR Screen
              </Text>
              <input
                type="file"
                accept="image/*"
                onChange={handleQrImageUpload}
                style={{ fontSize: 13, cursor: 'pointer' }}
              />
            </div>
          )}

          <Button
            type="primary"
            size="large"
            block
            icon={<SafetyCertificateOutlined />}
            onClick={() => confirmQrScan()}
            disabled={!isQrDetected}
            style={{ height: 46, fontWeight: 700, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
          >
            Confirm {qrActionType === 'CHECK_IN' ? 'Entrance Check-In' : 'Exit Check-Out'}
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
          <Form.Item name="hoursSpent" label={<span style={{ fontWeight: 700, fontSize: 14 }}>Hours Spent Today</span>} initialValue={8.0} rules={[{ required: true, message: 'Please specify hours spent' }]}>
            <Input type="number" step="0.5" min="0.5" max="24" placeholder="8.0" addonAfter="hrs" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Attendance;
