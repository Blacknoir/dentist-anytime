"use client"

import React from 'react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { useLanguage } from '@/lib/LanguageContext'
import { motion } from 'framer-motion'
import { TrendingUp, MousePointer2, Clock, Users, Activity } from 'lucide-react'

const lineData = [
    { name: '1', value: 35 },
    { name: '2', value: 42 },
    { name: '3', value: 38 },
    { name: '4', value: 50 },
    { name: '5', value: 45 },
    { name: '6', value: 57 },
    { name: '7', value: 52 },
    { name: '8', value: 65 },
    { name: '9', value: 55 },
    { name: '10', value: 60 },
    { name: '11', value: 58 },
    { name: '12', value: 48 },
]

const barData = [
    { name: '1', bounce: 20, render: 80 },
    { name: '2', bounce: 25, render: 75 },
    { name: '3', bounce: 30, render: 90 },
    { name: '4', bounce: 22, render: 85 },
    { name: '5', bounce: 18, render: 95 },
    { name: '6', bounce: 35, render: 70 },
    { name: '7', bounce: 28, render: 88 },
    { name: '8', bounce: 15, render: 92 },
    { name: '9', bounce: 40, render: 65 },
    { name: '10', bounce: 32, render: 78 },
    { name: '11', bounce: 27, render: 82 },
    { name: '12', bounce: 20, render: 89 },
]

export function AnalyticsDashboard() {
    const { t } = useLanguage()

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b1120] rounded-2xl md:rounded-[2rem] p-4 md:p-8 text-white shadow-2xl border border-slate-800"
        >
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 gap-4">
                <div className="w-full md:w-auto">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <Activity className="text-primary-400 h-5 w-5 md:h-6 md:w-6" />
                        {t('analytics.title')}
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">Real-time performance metrics</p>
                </div>
                <div className="bg-slate-800/50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-slate-700 flex items-center gap-2 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-green-500 animate-pulse" />
                    Live Updates
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Line Chart Section */}
                <div className="bg-slate-900/40 p-4 md:p-6 rounded-2xl border border-slate-800/50 h-[220px] md:h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            {t('analytics.bounce_rate_last_7')}
                        </h3>
                        <div className="text-primary-400 font-bold text-lg">57.1%</div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lineData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff5db1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ff5db1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                itemStyle={{ color: '#ff5db1' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#ff5db1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart Section */}
                <div className="bg-slate-900/40 p-4 md:p-6 rounded-2xl border border-slate-800/50 h-[220px] md:h-[300px]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                        {t('analytics.render_vs_bounce')}
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                            />
                            <Bar dataKey="render" fill="#00d1ff" radius={[4, 4, 0, 0]} barSize={10} />
                            <Bar dataKey="bounce" fill="#ff5db1" radius={[4, 4, 0, 0]} barSize={10} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="space-y-0.5 md:space-y-1">
                    <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 md:gap-2">
                        <MousePointer2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {t('analytics.page_views')}
                    </div>
                    <div className="text-lg md:text-2xl font-extrabold text-[#00d1ff]">2.7Mpv</div>
                </div>

                <div className="space-y-0.5 md:space-y-1">
                    <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 md:gap-2">
                        <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {t('analytics.bounce_rate')}
                    </div>
                    <div className="text-lg md:text-2xl font-extrabold text-[#ff5db1]">40.6%</div>
                </div>

                <div className="space-y-0.5 md:space-y-1">
                    <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 md:gap-2">
                        <Users className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {t('analytics.sessions')}
                    </div>
                    <div className="text-lg md:text-2xl font-extrabold text-green-400">479K</div>
                </div>

                <div className="space-y-0.5 md:space-y-1">
                    <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 md:gap-2">
                        <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {t('analytics.session_length')}
                    </div>
                    <div className="text-lg md:text-2xl font-extrabold text-blue-400">17min</div>
                </div>
            </div>
        </motion.div>
    )
}
