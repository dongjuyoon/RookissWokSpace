// 게시판 말머리 목록 (서버와 화면이 함께 씁니다)
export const NOTICE_CATEGORIES = ["인사", "워크스페이스", "국비", "버그&건의"] as const;

export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];
