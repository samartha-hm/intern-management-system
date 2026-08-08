import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const totalInterns = await prisma.user.count({
    where: { role: 'INTERN', isActive: true },
  });

  const activeInternships = await prisma.internship.count({
    where: { status: 'ACTIVE' },
  });

  const pendingApplications = await prisma.application.count({
    where: { status: 'PENDING' },
  });

  const completedEvaluations = await prisma.evaluation.count();

  // Calculate average rating from evaluations
  const evaluations = await prisma.evaluation.findMany({
    select: { overallRating: true },
  });

  let avgPerformanceScore: number | null = null;
  if (evaluations.length > 0) {
    const validRatings = evaluations.filter((e) => e.overallRating !== null);
    if (validRatings.length > 0) {
      const sum = validRatings.reduce((acc, curr) => acc + (curr.overallRating || 0), 0);
      avgPerformanceScore = Math.round((sum / validRatings.length) * 20); // convert 1-5 rating to percentage
    }
  }

  // Department counts
  const departmentCounts = await prisma.user.groupBy({
    by: ['department'],
    where: { role: 'INTERN', department: { not: null } },
    _count: { id: true },
  });

  const departmentData = departmentCounts.map((d) => ({
    name: d.department || 'General',
    interns: d._count.id,
  }));

  // Application status distribution
  const applicationStatusCounts = await prisma.application.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const statusColors: Record<string, string> = {
    ACCEPTED: '#10b981',
    UNDER_REVIEW: '#3b82f6',
    PENDING: '#f59e0b',
    REJECTED: '#ef4444',
    WITHDRAWN: '#6b7280',
  };

  const applicationStatusData = applicationStatusCounts.map((a) => ({
    name: a.status.replace('_', ' '),
    value: a._count.id,
    color: statusColors[a.status] || '#8b5cf6',
  }));

  res.json({
    stats: {
      totalInterns,
      activeInternships,
      pendingApplications,
      completedEvaluations,
      avgPerformanceScore,
    },
    departmentData,
    applicationStatusData,
  });
});
