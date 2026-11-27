"use server";

// 조직도 화면이 부르는 함수입니다. 가입할 때 저장된 profiles 를 그대로 읽고, 승인된 사람만 보여줍니다.
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireApprovedProfile } from "@/lib/auth";

export type DirectoryMember = {
  id: string;
  name: string;
  title: string;
  email: string;
  employeeNo: string | null;
  role: "member" | "admin";
  online: boolean;
};

export type DirectoryGroup = {
  department: string;
  members: DirectoryMember[];
};

// 부서 표시 순서 (CLAUDE.md 6). 여기에 없는 부서는 뒤에 읽은 순서대로 붙습니다.
const DEPARTMENT_ORDER = ["경영지원", "개발", "디자인"];

function departmentRank(department: string): number {
  const index = DEPARTMENT_ORDER.indexOf(department);
  return index === -1 ? DEPARTMENT_ORDER.length : index;
}

// 승인된 구성원만 부서별로 묶어 돌려줍니다. 승인 대기 · 거절된 사람은 빠집니다.
export async function listDirectory(): Promise<DirectoryGroup[]> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, title, department, email, employee_no, role, online")
    .eq("status", "approved")
    .order("employee_no", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  if (error) throw new Error("조직도를 불러오지 못했습니다.");

  const groups = new Map<string, DirectoryMember[]>();
  for (const row of data ?? []) {
    const member: DirectoryMember = {
      id: row.id,
      name: row.name,
      title: row.title,
      email: row.email ?? "",
      employeeNo: row.employee_no,
      role: row.role,
      online: row.online ?? false,
    };
    const list = groups.get(row.department) ?? [];
    list.push(member);
    groups.set(row.department, list);
  }

  // Array.sort 는 같은 순위끼리 원래 순서를 지키므로 나머지 부서도 읽은 순서를 유지합니다.
  return [...groups.keys()]
    .sort((a, b) => departmentRank(a) - departmentRank(b))
    .map((department) => ({ department, members: groups.get(department) ?? [] }));
}
