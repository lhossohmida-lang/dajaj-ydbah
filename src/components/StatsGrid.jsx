import {
  CircleDollarSign,
  Coins,
  Gauge,
  Percent,
  Scale,
  TrendingUp,
  Wallet,
  Weight,
} from 'lucide-react';
import StatCard from './StatCard.jsx';
import { formatCurrency, formatKg, formatNumber, formatPercent } from '../utils/formatters.js';

export default function StatsGrid({ stats, currency }) {
  const cards = [
    { title: 'عدد عمليات الذبح', value: formatNumber(stats.slaughterCount, true), icon: Gauge, tone: 'teal' },
    { title: 'عدد الدجاج', value: formatNumber(stats.chickenCount, true), icon: Weight, tone: 'sky' },
    { title: 'الوزن الحي الكلي', value: formatKg(stats.totalLiveWeight), icon: Scale, tone: 'amber' },
    { title: 'الوزن الصافي', value: formatKg(stats.netWeight), icon: Scale, tone: 'emerald' },
    { title: 'إجمالي المداخيل', value: formatCurrency(stats.revenue, currency), icon: CircleDollarSign, tone: 'emerald' },
    { title: 'إجمالي المصاريف', value: formatCurrency(stats.totalExpenses, currency), icon: Wallet, tone: 'rose' },
    { title: 'الربح الصافي', value: formatCurrency(stats.netProfit, currency), icon: TrendingUp, tone: stats.netProfit >= 0 ? 'emerald' : 'rose' },
    { title: 'الربح لكل دجاجة', value: formatCurrency(stats.profitPerChicken, currency), icon: Coins, tone: stats.profitPerChicken >= 0 ? 'emerald' : 'rose' },
    { title: 'هامش الربح', value: formatPercent(stats.profitMargin), icon: Percent, tone: stats.profitMargin >= 0 ? 'emerald' : 'rose' },
    { title: 'سعر التعادل للكيلو', value: formatCurrency(stats.breakEvenKgPrice, currency), icon: Gauge, tone: 'amber' },
    { title: 'نقطة التعادل بالكيلو', value: formatKg(stats.breakEvenKg), icon: Weight, tone: 'teal' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
