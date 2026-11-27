// 모든 날짜·시각은 한국 시간(Asia/Seoul) 기준입니다.
const TZ = "Asia/Seoul";

// 날짜는 YYYY-MM-DD (ISO 문자열이나 Date 를 받습니다)
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date(value));
}

// 2026년 11월 23일 월요일
export function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

// 시각 HH:MM (24시간제)
export function formatClock(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// 한국 시간 기준 시(0~23)
export function seoulHour(date: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return Number(hour);
}

// 시각에 맞춘 인사말 (아침 · 낮 · 저녁)
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 11) return "좋은 아침이에요.";
  if (hour >= 11 && hour < 18) return "좋은 오후예요.";
  return "하루가 저물었네요.";
}

// 입사일부터 오늘까지의 근속 (예: 2년 3개월)
export function tenureLabel(joinedOn: string | null, today: Date = new Date()): string {
  if (!joinedOn) return "—";
  const [jy, jm, jd] = joinedOn.split("-").map(Number);
  const [ty, tm, td] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(today)
    .split("-")
    .map(Number);

  let months = (ty - jy) * 12 + (tm - jm);
  if (td < jd) months -= 1;
  if (months < 0) return "—";

  const years = Math.floor(months / 12);
  const rest = months % 12;
  return years > 0 ? `${years}년 ${rest}개월` : `${rest}개월`;
}
