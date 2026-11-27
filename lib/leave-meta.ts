// 휴가 종류와 연차 기준 (서버와 화면이 함께 씁니다)
export const LEAVE_KINDS = ["연차"] as const;

export type LeaveKind = (typeof LEAVE_KINDS)[number];

// 1년에 주는 연차 일수
export const ANNUAL_LEAVE_DAYS = 16;

export const LEAVE_STATUS_LABEL = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
} as const;

export type LeaveStatus = keyof typeof LEAVE_STATUS_LABEL;
