export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// --- User wire types ---

export type UserRole = 'USER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface UserResponse {
  id: number;
  email: string;
  phone: string | null;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  profilePicture: string | null;
  positionId: number | null;
  positionName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  createdAt: string;
}

export interface UserTeam {
  id: number;
  name: string;
  description: string | null;
  joinedAt: string;
}

export interface UsersListParams {
  search?: string;
  role?: string;
  status?: string;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

// --- Team wire types ---

export interface TeamResponse {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: number;
  email: string;
  name: string | null;
  positionName: string | null;
  joinedAt: string;
}

export interface MyTeamResponse extends TeamResponse {
  members: TeamMember[];
}

export interface TeamsListParams {
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

// --- Department wire types ---

export interface DepartmentResponse {
  id: number;
  name: string;
  description: string | null;
  headId: number | null;
  headName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentsListParams {
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

// --- Position wire types ---

export interface PositionResponse {
  id: number;
  name: string;
  description: string | null;
  reportsToId: number | null;
  reportsToName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionsListParams {
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export interface MyProfileResponse extends UserResponse {
  supervisorId: number | null;
  supervisorName: string | null;
}

// --- Auth wire types ---

export interface MeResponse {
  id: number;
  email: string;
  role: UserRole;
  profilePicture: string | null;
  impersonatedBy?: number;
  permissions: string[];
}

// --- Leave wire types ---

export type LeaveType =
  | 'ANNUAL'
  | 'SICK'
  | 'UNPAID'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'BEREAVEMENT'
  | 'OTHER';

export type LeaveStatus =
  | 'PENDING'
  | 'PENDING_MANAGER'
  | 'PENDING_ADMIN'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type HalfDay = 'AM' | 'PM';

export type ApprovalStage = 'MANAGER' | 'ADMIN';

export interface LeaveRequestResponse {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod: HalfDay | null;
  durationDays: number;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveApprovalStepResponse {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approverName: string | null;
  approverEmail: string;
  stage: ApprovalStage;
  status: LeaveStatus;
  comment: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface LeaveRequestDetailResponse extends LeaveRequestResponse {
  userPositionName: string | null;
  userDepartmentName: string | null;
  approvalSteps: LeaveApprovalStepResponse[];
}

export interface LeaveBalanceResponse {
  id: number;
  userId: number;
  leaveType: LeaveType;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  debt: number;
  lastAccruedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalanceAuditResponse {
  id: number;
  userId: number;
  leaveType: LeaveType;
  eventType: string;
  amount: number;
  debtDelta: number;
  note: string | null;
  createdAt: string;
}

export interface LeaveAccrualConfigResponse {
  id: number;
  leaveType: LeaveType;
  monthlyRate: number;
  daysPerYear: number;
  carryOverLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalanceGrantInput {
  leaveType: string;
  amount: number;
  note?: string;
}

export interface LeaveBalanceWithUser extends LeaveBalanceResponse {
  userName: string | null;
  userEmail: string;
}

export interface PublicHolidayResponse {
  id: number;
  name: string;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveApprovalHistoryItem extends LeaveRequestResponse {
  myDecision: 'APPROVED' | 'REJECTED';
  myComment: string | null;
  myDecidedAt: string | null;
}

export interface LeaveRequestsListParams {
  search?: string;
  status?: string;
  leaveType?: string;
  userId?: number;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export interface LeaveBalancesListParams {
  userId?: number;
  leaveType?: string;
  year?: number;
  page?: number;
  pageSize?: number;
}

export interface LeaveAccrualConfigsListParams {
  leaveType?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicHolidaysListParams {
  year?: number;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export interface AccrueBalancePayload {
  runId: string;
  userId: number;
  leaveType: LeaveType;
  year: number;
  month: number;
}
