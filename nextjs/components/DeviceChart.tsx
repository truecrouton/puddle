'use client';


import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

// #region Sample data
const data = [
    {
        name: 'A',
        uv: 400,
        pv: 240,
        amt: 2400,
    },
    {
        name: 'B',
        uv: 300,
        pv: 456,
        amt: 2400,
    },
    {
        name: 'C',
        uv: 300,
        pv: 139,
        amt: 2400,
    },
    {
        name: 'D',
        uv: 200,
        pv: 980,
        amt: 2400,
    },
    {
        name: 'E',
        uv: 278,
        pv: 390,
        amt: 2400,
    },
    {
        name: 'F',
        uv: 189,
        pv: 480,
        amt: 2400,
    },
];

// #endregion

export default function IndexLineChart() {
    return (
        <LineChart style={{ width: '100%', aspectRatio: 1.618, margin: 'auto', marginBottom: 30 }} responsive data={data}>
            <CartesianGrid strokeDasharray="5 5" opacity={0.5} />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis width="auto" fontSize={12} />
            <Tooltip contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                borderRadius: '0.5rem',
                color: '#ffffff'
            }} />
            <Line type="monotone" dataKey="uv" />
            <Line type="monotone" dataKey="pv" stroke="#3b82f6" />
            <Legend position="insideTopRight" offset={20} />
        </LineChart>
    );
}