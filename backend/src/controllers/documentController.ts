import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images, PDFs, and common document types
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed!'));
    }
  }
});

// Helper: check if entity exists
async function entityExists(entityId: string, entityType: string): Promise<boolean> {
  switch (entityType) {
    case 'INTERN':
    case 'USER':
      return (await prisma.user.findUnique({ where: { id: entityId } })) !== null;
    case 'INTERNSHIP':
      return (await prisma.internship.findUnique({ where: { id: entityId } })) !== null;
    case 'APPLICATION':
      return (await prisma.application.findUnique({ where: { id: entityId } })) !== null;
    case 'PROJECT':
      return (await prisma.project.findUnique({ where: { id: entityId } })) !== null;
    default:
      return false;
  }
}

// Helper: check if mentor has permission for an intern entity
async function mentorHasPermission(mentorId: string, internId: string): Promise<boolean> {
  const internship = await prisma.internship.findFirst({
    where: {
      mentorId: mentorId,
      interns: {
        some: {
          id: internId,
        },
      },
    },
  });
  return internship !== null;
}

const VALID_ENTITY_TYPES = ['INTERN', 'INTERNSHIP', 'APPLICATION', 'PROJECT', 'USER'];

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  // Promise-wrapped multer execution to prevent unhandled callback exceptions
  try {
    await new Promise<void>((resolve, reject) => {
      upload.single('file')(req, res, (err: any) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err: any) {
    res.status(400);
    throw new Error(err.message || 'File upload failed');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const { entityId, entityType } = req.body;

  // Validate entityType
  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error('Invalid entity type');
  }

  // Check if entity exists
  if (!(await entityExists(entityId, entityType))) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(404);
    throw new Error('Entity not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user!.role === 'ADMIN' || req.user!.role === 'HR') {
    hasPermission = true;
  } else if (req.user!.role === 'MENTOR') {
    if (entityType === 'INTERN' || entityType === 'USER') {
      hasPermission = await mentorHasPermission(req.user!.id, entityId);
    }
  } else {
    // Interns can upload documents for themselves
    if ((entityType === 'INTERN' || entityType === 'USER') && entityId === req.user!.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(403);
    throw new Error('Not authorized to upload document for this entity');
  }

  // Create document record
  const document = await prisma.document.create({
    data: {
      entityId,
      entityType: entityType as any,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user!.id,
    },
  });

  res.status(201).json(document);
});

// @desc    Get documents for an entity
// @route   GET /api/documents/entity/:entityId/:entityType
// @access  Private
export const getDocumentsByEntity = asyncHandler(async (req: Request, res: Response) => {
  const { entityId, entityType } = req.params;

  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
    res.status(400);
    throw new Error('Invalid entity type');
  }

  if (!(await entityExists(entityId, entityType))) {
    res.status(404);
    throw new Error('Entity not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user!.role === 'ADMIN' || req.user!.role === 'HR') {
    hasPermission = true;
  } else if (req.user!.role === 'MENTOR') {
    if (entityType === 'INTERN') {
      hasPermission = await mentorHasPermission(req.user!.id, entityId);
    }
  } else {
    if ((entityType === 'INTERN' || entityType === 'USER') && entityId === req.user!.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to view documents for this entity');
  }

  const documents = await prisma.document.findMany({
    where: {
      entityId,
      entityType: entityType as any,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  res.json(documents);
});

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = asyncHandler(async (req: Request, res: Response) => {
  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: {
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user!.role === 'ADMIN' || req.user!.role === 'HR') {
    hasPermission = true;
  } else if (req.user!.role === 'MENTOR') {
    if (document.entityType === 'INTERN') {
      hasPermission = await mentorHasPermission(req.user!.id, document.entityId);
    }
  } else {
    if ((document.entityType === 'INTERN' || document.entityType === 'USER') && document.entityId === req.user!.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to view this document');
  }

  res.json(document);
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
  });

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user!.role === 'ADMIN' || req.user!.role === 'HR') {
    hasPermission = true;
  } else if (req.user!.role === 'MENTOR') {
    if (document.entityType === 'INTERN') {
      hasPermission = await mentorHasPermission(req.user!.id, document.entityId);
    }
  } else {
    if (document.uploadedBy === req.user!.id) {
      hasPermission = true;
    } else if ((document.entityType === 'INTERN' || document.entityType === 'USER') && document.entityId === req.user!.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to delete this document');
  }

  // Delete file from filesystem
  const filePath = `.${document.fileUrl}`;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete document record
  await prisma.document.delete({
    where: { id: document.id },
  });

  res.json({ message: 'Document removed' });
});

// @desc    Download document
// @route   GET /api/documents/download/:id
// @access  Private
export const downloadDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
  });

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  let hasPermission = false;

  if (req.user!.role === 'ADMIN' || req.user!.role === 'HR') {
    hasPermission = true;
  } else if (req.user!.role === 'MENTOR') {
    if (document.entityType === 'INTERN') {
      hasPermission = await mentorHasPermission(req.user!.id, document.entityId);
    }
  } else {
    if ((document.entityType === 'INTERN' || document.entityType === 'USER') && document.entityId === req.user!.id) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to download this document');
  }

  const filePath = `.${document.fileUrl}`;
  if (fs.existsSync(filePath)) {
    res.download(filePath, document.fileName);
  } else {
    res.status(404);
    throw new Error('File not found on server');
  }
});