'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

type CategoryData = {
    name: string;
    value: number;
};

type KeywordData = {
    name: string;
    value: number;
};

type AnalyticsChartsProps = {
    categoryData: CategoryData[];
    keywordData: KeywordData[];
    metadataStatus: {
        withMetadata: number;
        withoutMetadata: number;
    };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsCharts({
    categoryData,
    keywordData,
    metadataStatus,
}: AnalyticsChartsProps) {
    const metadataData = [
        { name: 'With Metadata', value: metadataStatus.withMetadata },
        { name: 'Without Metadata', value: metadataStatus.withoutMetadata },
    ];

    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title">AI Category Distribution</h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title">Metadata Coverage</h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metadataData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#82ca9d"
                                        dataKey="value"
                                    >
                                        <Cell fill="#00C49F" />
                                        <Cell fill="#FF8042" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Top Keywords</h2>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={keywordData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#8884d8" name="Frequency" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
