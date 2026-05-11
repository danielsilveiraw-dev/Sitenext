import DashboardClient from "./DashboardClient";

export default async function BotDashboardPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const { botId } = await params;

  return <DashboardClient botId={botId} />;
}