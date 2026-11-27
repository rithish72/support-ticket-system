"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	LogOut,
	Plus,
	TicketCheck,
	Ticket,
	Users,
} from "lucide-react";

import { homeFor, useAuth } from "@/components/providers/AuthProvider";
import NotificationBell from "@/components/NotificationBell";
import { PageLoader } from "@/components/ui";
import type { UserRole } from "@/types";

const NAV: Record<
	UserRole,
	{ href: string; label: string; icon: typeof Ticket }[]
> = {
	user: [
		{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/tickets", label: "My tickets", icon: Ticket },
	],
	admin: [
		{ href: "/admin", label: "Overview", icon: LayoutDashboard },
		{ href: "/admin/tickets", label: "Tickets", icon: Ticket },
		{ href: "/admin/users", label: "Users", icon: Users },
	],
};

/** Suspense boundary for pathname-dependent rendering. */
export default function AppShell({
	role,
	children,
}: {
	role: UserRole;
	children: ReactNode;
}) {
	return (
		<Suspense fallback={<PageLoader label="Loading dashboard..." />}>
			<AppShellContent role={role}>{children}</AppShellContent>
		</Suspense>
	);
}

/** Page frame + route guard. */
function AppShellContent({
	role,
	children,
}: {
	role: UserRole;
	children: ReactNode;
}) {
	const { user, loading, logout } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (loading) return;

		if (!user) {
			router.replace("/login");
		} else if (user.role !== role) {
			router.replace(homeFor(user.role));
		}
	}, [loading, user, role, router]);

	if (loading || !user || user.role !== role) {
		return <PageLoader label="Checking your session…" />;
	}

	const isActive = (href: string) =>
		pathname === href ||
		(href !== "/admin" &&
			href !== "/dashboard" &&
			pathname.startsWith(`${href}/`));

	const handleLogout = async () => {
		await logout();
		router.replace("/login");
	};

	return (
		<div className="min-h-screen bg-slate-50">
			<header className="sticky top-0 z-20 bg-teal-900 text-white">
				<div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-8">
					<Link
						href={homeFor(role)}
						className="flex items-center gap-2 font-semibold tracking-tight"
					>
						<TicketCheck size={22} className="text-amber-300" />
						SupportDesk
					</Link>

					<nav
						className="ml-2 hidden items-center gap-1 md:flex"
						aria-label="Main"
					>
						{NAV[role].map(({ href, label, icon: Icon }) => (
							<Link
								key={href}
								href={href}
								aria-current={
									isActive(href) ? "page" : undefined
								}
								className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
									isActive(href)
										? "bg-white/15 font-medium text-white"
										: "text-teal-100 hover:bg-white/10"
								}`}
							>
								<Icon size={16} />
								{label}
							</Link>
						))}
					</nav>

					<div className="ml-auto flex items-center gap-1 sm:gap-2">
						{role === "user" && (
							<Link
								href="/tickets/create"
								className="mr-1 hidden items-center gap-1.5 rounded-md bg-amber-300 px-3 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-200 sm:flex"
							>
								<Plus size={16} /> New ticket
							</Link>
						)}

						<NotificationBell role={role} />

						<div className="hidden pl-2 text-right leading-tight sm:block">
							<p className="max-w-40 truncate text-sm font-medium">
								{user.name}
							</p>
							<p className="text-xs capitalize text-teal-200">
								{user.role}
							</p>
						</div>

						<button
							onClick={() => void handleLogout()}
							aria-label="Sign out"
							title="Sign out"
							className="rounded-md p-2 text-teal-50 hover:bg-white/10"
						>
							<LogOut size={19} />
						</button>
					</div>
				</div>

				{/* Mobile navigation */}
				<nav
					className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2 md:hidden"
					aria-label="Main"
				>
					{NAV[role].map(({ href, label }) => (
						<Link
							key={href}
							href={href}
							aria-current={isActive(href) ? "page" : undefined}
							className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
								isActive(href)
									? "bg-white/15 font-medium"
									: "text-teal-100"
							}`}
						>
							{label}
						</Link>
					))}

					{role === "user" && (
						<Link
							href="/tickets/create"
							className="ml-auto whitespace-nowrap rounded-md bg-amber-300 px-3 py-1.5 text-sm font-semibold text-slate-900"
						>
							New ticket
						</Link>
					)}
				</nav>
			</header>

			<main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
				{children}
			</main>
		</div>
	);
}
