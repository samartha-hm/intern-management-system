// Extend Express Request to include user property
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      department?: string | null;
      position?: string | null;
    };
  }
}
