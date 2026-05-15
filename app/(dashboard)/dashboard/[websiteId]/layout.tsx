export default function WebsiteDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-6xl">{children}</div>;
}
