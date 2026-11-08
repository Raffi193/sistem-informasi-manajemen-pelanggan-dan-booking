"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  AgeDistributionPoint,
  HourPopularityPoint,
  MonthlyBookingPoint,
  MonthlyCustomerPoint,
  PackagePopularityPoint,
  StatusDistributionPoint,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

const COLORS = {
  primary: "#2563eb",
  blue: "#3b82f6",
  green: "#22c55e",
  amber: "#f59e0b",
  violet: "#7c3aed",
} as const;

const tooltipStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  backgroundColor: "#ffffff",
  color: "#0a0a0b",
  fontSize: 12,
  padding: "8px 12px",
};

const tooltipLabelStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: 12,
  marginBottom: 4,
};

const tooltipItemStyle: CSSProperties = {
  fontSize: 12,
  padding: 0,
};

function ChartCard({
  title,
  description,
  empty,
  className,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div>
        <h2 className="font-display font-bold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-4">
        {empty ? (
          <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 px-4 text-center text-sm text-muted-foreground">
            Belum ada data pada periode ini.
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function monthlyTooltipLabel(
  payload: readonly { payload?: unknown }[] | undefined,
) {
  const point = payload?.[0]?.payload as { fullLabel?: string } | undefined;
  return point?.fullLabel ?? "";
}

export function BookingTrendChart({
  data,
}: {
  data: MonthlyBookingPoint[];
}) {
  const empty = data.every((item) => item.total === 0);

  return (
    <ChartCard
      title="Tren pemesanan per bulan"
      description="Booking dibuat pada periode ini. Disetujui = aktif; Selesai = masa latihan tuntas."
      empty={empty}
      className="lg:col-span-2"
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={COLORS.primary}
                stopOpacity={0.24}
              />
              <stop
                offset="95%"
                stopColor={COLORS.primary}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            width={32}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
            labelFormatter={(_, payload) => monthlyTooltipLabel(payload)}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Total booking"
            stroke={COLORS.primary}
            strokeWidth={2.5}
            fill="url(#bookingGradient)"
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="approved"
            name="Disetujui (aktif)"
            stroke={COLORS.green}
            strokeWidth={2.5}
            dot={{ r: 2.5, strokeWidth: 0, fill: COLORS.green }}
            activeDot={{ r: 4 }}
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="Selesai"
            stroke={COLORS.violet}
            strokeWidth={2.5}
            dot={{ r: 2.5, strokeWidth: 0, fill: COLORS.violet }}
            activeDot={{ r: 4 }}
            animationDuration={500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CustomerTrendChart({
  data,
}: {
  data: MonthlyCustomerPoint[];
}) {
  const empty = data.every((item) => item.total === 0);

  return (
    <ChartCard
      title="Tren siswa baru per bulan"
      description="Jumlah customer yang mendaftar pada periode ini."
      empty={empty}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={COLORS.blue}
                stopOpacity={0.24}
              />
              <stop
                offset="95%"
                stopColor={COLORS.blue}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            width={32}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
            labelFormatter={(_, payload) => monthlyTooltipLabel(payload)}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Pendaftar baru"
            stroke={COLORS.blue}
            strokeWidth={2.5}
            fill="url(#customerGradient)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PackagePopularityChart({
  data,
}: {
  data: PackagePopularityPoint[];
}) {
  return (
    <ChartCard
      title="Popularitas paket"
      description="Jumlah booking valid per paket, tanpa booking ditolak atau batal."
      empty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 28, bottom: 4, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e5e7eb"
          />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(value: string) =>
              value.length > 18 ? `${value.slice(0, 16)}…` : value
            }
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
          />
          <Bar
            dataKey="count"
            name="Booking"
            fill={COLORS.blue}
            radius={[0, 8, 8, 0]}
            barSize={18}
            animationDuration={500}
          >
            <LabelList
              dataKey="count"
              position="right"
              fill="#6b7280"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function StatusDonutChart({
  data,
}: {
  data: StatusDistributionPoint[];
}) {
  const visible = data.filter((item) => item.count > 0);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartCard
      title="Distribusi status booking"
      description="Kondisi booking pada periode ini."
      empty={total === 0}
    >
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={visible}
              dataKey="count"
              nameKey="label"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={visible.length > 1 ? 2 : 0}
              stroke="#ffffff"
              strokeWidth={2}
              animationDuration={500}
            >
              {visible.map((item) => (
                <Cell key={item.status} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="font-display text-xl font-bold">{total}</span>
        </div>
      </div>

      <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {visible.map((item) => (
          <li
            key={item.status}
            className="flex min-w-0 items-center gap-2 text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="min-w-0 flex-1 truncate" title={item.label}>
              {item.label}
            </span>
            <span className="font-medium text-foreground">{item.count}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function HourPopularityChart({
  data,
}: {
  data: HourPopularityPoint[];
}) {
  return (
    <ChartCard
      title="Jam latihan terpopuler"
      description="Jumlah booking valid per slot jam pada periode ini."
      empty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 28, bottom: 4, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e5e7eb"
          />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={104}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ fill: "rgba(34, 197, 94, 0.06)" }}
          />
          <Bar
            dataKey="count"
            name="Booking"
            fill={COLORS.green}
            radius={[0, 8, 8, 0]}
            barSize={18}
            animationDuration={500}
          >
            <LabelList
              dataKey="count"
              position="right"
              fill="#6b7280"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AgeDistributionChart({
  data,
}: {
  data: AgeDistributionPoint[];
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartCard
      title="Demografi usia customer"
      description="Usia saat mendaftar, dihitung dari tanggal lahir customer."
      empty={total === 0}
      className="lg:col-span-2"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 12, left: -18, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="range"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            width={32}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ fill: "rgba(245, 158, 11, 0.06)" }}
          />
          <Bar
            dataKey="count"
            name="Customer"
            fill={COLORS.amber}
            radius={[8, 8, 0, 0]}
            barSize={36}
            animationDuration={500}
          >
            <LabelList
              dataKey="count"
              position="top"
              fill="#6b7280"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
