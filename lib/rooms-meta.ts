// 회의실 예약 공통 설정 (서버와 화면이 함께 씁니다). 날짜는 YYYY-MM-DD, 시간은 HH:MM 입니다.

// 회의실 번호: 01 ~ 09
export const ROOM_NUMBERS = ["01", "02", "03", "04", "05", "06", "07", "08", "09"] as const;
export type RoomNo = (typeof ROOM_NUMBERS)[number];

// 시간표에 보이는 시간 범위와 예약 단위 (30분)
export const DAY_START = "08:00";
export const DAY_END = "22:00";
export const SLOT_MINUTES = 30;

// 시작·종료 시각 선택지 (08:00 ~ 22:00, 30분 단위)
export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let m = toMinutes(DAY_START); m <= toMinutes(DAY_END); m += SLOT_MINUTES) {
    out.push(fromMinutes(m));
  }
  return out;
})();

export function isRoomNo(value: string): value is RoomNo {
  return (ROOM_NUMBERS as readonly string[]).includes(value);
}

// "HH:MM" → 0시부터의 분
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// YYYY-MM-DD 에 n일 더하기 (시간대와 무관하게 날짜만 계산)
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

// 그 날짜가 속한 주의 월요일 (YYYY-MM-DD)
export function mondayOf(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = 일
  const offset = (weekday + 6) % 7; // 월요일이면 0
  return addDays(ymd, -offset);
}

export const WEEKDAY_LABEL = ["월", "화", "수", "목", "금", "토", "일"] as const;
