import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import type {
  CaptureWithRelations,
  ObjectiveWithRelations,
  TeamMemberWithRelations,
  TeamWithLeader,
} from "@/types/domain";

export type Trend = "up" | "down" | "stable";

export type ChartPoint = {
  date: string;
  socios: number;
};

export type TeamRankingItem = TeamWithLeader & {
  total: number;
  memberCount: number;
  objective: number;
  monthTotal: number;
  pct: number;
};

export type CaptadorRankingItem = {
  id: string;
  name: string;
  total: number;
  monthTotal: number;
};

export type TeamDetail = TeamWithLeader & {
  totalPeriod: number;
  totalMonth: number;
  objective: number;
  pct: number;
  memberStats: MemberStat[];
};

export type MemberStat = TeamMemberWithRelations & {
  total: number;
  monthTotal: number;
  objective: number;
  pct: number;
};

export type CaptadorDetail = {
  userId: string;
  name: string;
  teamName: string;
  role: string;
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  periodTotal: number;
  trend: Trend;
  objective: number;
  pct: number;
  dailyData: ChartPoint[];
};

export function monthStartFor(date = new Date()) {
  return format(date, "yyyy-MM-01");
}

export function weekRangeFor(date = new Date()) {
  return {
    weekStart: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    weekEnd: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}

export function sumCaptures(captures: CaptureWithRelations[]) {
  return captures.reduce((total, capture) => total + capture.num_socios, 0);
}

export function objectivePct(total: number, target?: number) {
  return target && target > 0 ? Math.round((total / target) * 100) : 0;
}

export function formatCaptadorName(capture: CaptureWithRelations) {
  return capture.profile?.full_name || capture.profile?.email || "?";
}

export function buildDailyData(captures: CaptureWithRelations[], dateFormat = "dd MMM") {
  const totalsByDate = new Map<string, number>();
  captures.forEach((capture) => {
    totalsByDate.set(capture.capture_date, (totalsByDate.get(capture.capture_date) || 0) + capture.num_socios);
  });

  return Array.from(totalsByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, socios]) => ({ date: format(parseISO(date), dateFormat, { locale: es }), socios }));
}

export function buildTeamRanking(
  teams: TeamWithLeader[],
  captures: CaptureWithRelations[],
  members: TeamMemberWithRelations[],
  objectives: ObjectiveWithRelations[],
  monthStart: string,
) {
  return teams
    .map((team): TeamRankingItem => {
      const teamCaptures = captures.filter((capture) => capture.team_id === team.id);
      const total = sumCaptures(teamCaptures);
      const monthTotal = sumCaptures(teamCaptures.filter((capture) => capture.capture_date >= monthStart));
      const memberCount = members.filter((member) => member.team_id === team.id).length;
      const teamObjective = objectives.find((objective) => objective.team_id === team.id && objective.period === "mensual");

      return {
        ...team,
        total,
        memberCount,
        objective: teamObjective?.target || 0,
        monthTotal,
        pct: objectivePct(monthTotal, teamObjective?.target),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function buildCaptadorRanking(captures: CaptureWithRelations[], monthStart: string) {
  const totalsByUser = new Map<string, CaptadorRankingItem>();

  captures.forEach((capture) => {
    const existing = totalsByUser.get(capture.user_id) || {
      id: capture.user_id,
      name: formatCaptadorName(capture),
      total: 0,
      monthTotal: 0,
    };

    existing.total += capture.num_socios;
    if (capture.capture_date >= monthStart) existing.monthTotal += capture.num_socios;
    totalsByUser.set(capture.user_id, existing);
  });

  return Array.from(totalsByUser.values()).sort((a, b) => b.total - a.total);
}

export function buildTeamDetails(
  teams: TeamWithLeader[],
  members: TeamMemberWithRelations[],
  captures: CaptureWithRelations[],
  objectives: ObjectiveWithRelations[],
  monthStart: string,
) {
  return teams.map((team): TeamDetail => {
    const teamMembers = members.filter((member) => member.team_id === team.id);
    const teamCaptures = captures.filter((capture) => capture.team_id === team.id);
    const totalPeriod = sumCaptures(teamCaptures);
    const totalMonth = sumCaptures(teamCaptures.filter((capture) => capture.capture_date >= monthStart));
    const teamObjective = objectives.find((objective) => objective.team_id === team.id && objective.period === "mensual");

    const memberStats = teamMembers
      .map((member): MemberStat => {
        const memberCaptures = teamCaptures.filter((capture) => capture.user_id === member.user_id);
        const monthCaptures = memberCaptures.filter((capture) => capture.capture_date >= monthStart);
        const memberObjective = objectives.find(
          (objective) => objective.user_id === member.user_id && objective.period === "mensual",
        );

        return {
          ...member,
          total: sumCaptures(memberCaptures),
          monthTotal: sumCaptures(monthCaptures),
          objective: memberObjective?.target || 0,
          pct: objectivePct(sumCaptures(monthCaptures), memberObjective?.target),
        };
      })
      .sort((a, b) => b.total - a.total);

    return {
      ...team,
      totalPeriod,
      totalMonth,
      objective: teamObjective?.target || 0,
      pct: objectivePct(totalMonth, teamObjective?.target),
      memberStats,
    };
  });
}

export function buildCaptadorDetails(
  captures: CaptureWithRelations[],
  members: TeamMemberWithRelations[],
  objectives: ObjectiveWithRelations[],
  today: string,
  weekAgo: string,
  twoWeeksAgo: string,
  monthStart: string,
) {
  const usersById = new Map<string, { name: string; teamName: string; role: string }>();

  members.forEach((member) => {
    usersById.set(member.user_id, {
      name: member.profile?.full_name || member.profile?.email || "?",
      teamName: member.team?.name || "",
      role: member.role,
    });
  });

  return Array.from(usersById.entries())
    .map(([userId, info]): CaptadorDetail => {
      const userCaptures = captures.filter((capture) => capture.user_id === userId);
      const todayTotal = sumCaptures(userCaptures.filter((capture) => capture.capture_date === today));
      const weekTotal = sumCaptures(userCaptures.filter((capture) => capture.capture_date >= weekAgo));
      const monthTotal = sumCaptures(userCaptures.filter((capture) => capture.capture_date >= monthStart));
      const periodTotal = sumCaptures(userCaptures);
      const lastWeek = weekTotal;
      const prevWeek = sumCaptures(
        userCaptures.filter((capture) => capture.capture_date >= twoWeeksAgo && capture.capture_date < weekAgo),
      );
      const trend: Trend = lastWeek > prevWeek ? "up" : lastWeek < prevWeek ? "down" : "stable";
      const objective = objectives.find((item) => item.user_id === userId && item.period === "mensual");

      return {
        userId,
        ...info,
        todayTotal,
        weekTotal,
        monthTotal,
        periodTotal,
        trend,
        objective: objective?.target || 0,
        pct: objectivePct(monthTotal, objective?.target),
        dailyData: buildDailyData(userCaptures, "dd/MM").slice(-14),
      };
    })
    .sort((a, b) => b.periodTotal - a.periodTotal);
}

export function buildResultAlerts(
  captadores: CaptadorRankingItem[],
  teams: TeamRankingItem[],
  objectives: ObjectiveWithRelations[],
) {
  const alerts: { type: "warning" | "success"; message: string }[] = [];

  captadores.forEach((captador) => {
    const objective = objectives.find((item) => item.user_id === captador.id && item.period === "mensual");
    if (objective && captador.monthTotal < objective.target * 0.5) {
      alerts.push({ type: "warning", message: `${captador.name} esta por debajo del 50% de su objetivo mensual` });
    }
  });

  if (captadores.length > 0) {
    alerts.push({
      type: "success",
      message: `Top captador: ${captadores[0].name} con ${captadores[0].total} socios`,
    });
  }

  teams.forEach((team) => {
    if (team.objective > 0 && team.pct < 50) {
      alerts.push({ type: "warning", message: `Equipo "${team.name}" por debajo del 50% del objetivo` });
    }
  });

  return alerts;
}
