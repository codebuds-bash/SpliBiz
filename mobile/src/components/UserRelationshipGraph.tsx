import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Svg, Circle, Line, Text as SvgText, G, Defs, Marker, Polygon } from 'react-native-svg';
import { styled } from 'nativewind';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const StyledView = styled(View);
const StyledText = styled(Text);

interface Member {
    user_id: string;
    name: string;
    avatar_url?: string;
}

interface Expense {
    expense_splits: any[];
    expense_payments: any[];
    amount: number;
    created_by: string;
}

interface UserRelationshipGraphProps {
    members: Member[];
    expenses: Expense[];
}

export default function UserRelationshipGraph({ members, expenses }: UserRelationshipGraphProps) {
    const { isDark } = useTheme();
    const { user } = useAuth();
    
    // --- 1. Calculate Balances ---
    const balances = useMemo(() => {
        const bal: Record<string, number> = {};
        members.forEach(m => bal[m.user_id] = 0);

        expenses.forEach(exp => {
            // Who paid?
            exp.expense_payments.forEach((payment: any) => {
                const pid = payment.user_id;
                if (bal[pid] !== undefined) bal[pid] += parseFloat(payment.paid_amount);
            });
            // Who owes?
            exp.expense_splits.forEach((split: any) => {
                const sid = split.user_id;
                if (bal[sid] !== undefined) bal[sid] -= parseFloat(split.share);
            });
        });
        return bal;
    }, [expenses, members]);

    // --- 2. Relationship Mapping ---
    const relationships = useMemo(() => {
        if (!user) return [];
        return members.filter(m => m.user_id !== user.id).map(m => ({
            id: m.user_id,
            name: m.name.split(' ')[0],
            balance: balances[m.user_id] || 0
        }));
    }, [balances, members, user]);

    // --- 3. Layout Logic ---
    const width = 340;
    const height = 220;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 90;

    // Current User Node
    const myBalance = user ? (balances[user.id] || 0) : 0;
    const myNode = {
        x: centerX,
        y: centerY,
        r: 25,
        color: myBalance >= 0 ? '#3ecf8e' : '#ef4444',
        label: "You",
        subLabel: `₹${Math.abs(myBalance).toFixed(0)}`
    };

    const others = relationships;
    const angleStep = (2 * Math.PI) / (others.length || 1);
    
    // Colors
    const lineColor = isDark ? "#535353" : "#e2e8f0";
    const textColor = isDark ? "#ffffff" : "#0f172a";

    return (
        <StyledView className={`rounded-2xl p-4 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
             <StyledView className="flex-row items-center justify-between mb-4">
                 <StyledText className={`font-bold font-sans text-base ${isDark ? 'text-white' : 'text-main'}`}>Group Balance Map</StyledText>
                 <StyledView className={`px-2 py-1 rounded bg-opacity-20 ${myBalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                     <StyledText className={`text-xs font-bold ${myBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                         {myBalance >= 0 ? "You are owed" : "You owe"} ₹{Math.abs(myBalance).toFixed(0)}
                     </StyledText>
                 </StyledView>
             </StyledView>

             <View style={{ alignItems: 'center' }}>
                 <Svg width={width} height={height}>
                     <Defs>
                        <Marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <Polygon points="0 0, 10 5, 0 10" fill={isDark ? "#b3b3b3" : "#94a3b8"} />
                        </Marker>
                     </Defs>

                     {/* LINES */}
                     {others.map((node, i) => {
                         const angle = i * angleStep - Math.PI / 2;
                         const x = centerX + radius * Math.cos(angle);
                         const y = centerY + radius * Math.sin(angle);
                         
                         let stroke = lineColor;
                         if (myBalance > 0 && node.balance < 0) stroke = "#1db954"; 
                         else if (myBalance < 0 && node.balance > 0) stroke = "#ef4444";
                         
                         return (
                            <Line key={`line-${i}`} x1={myNode.x} y1={myNode.y} x2={x} y2={y} stroke={stroke} strokeWidth="2" strokeDasharray={stroke === lineColor ? "4" : "0"} />
                         );
                     })}

                     {/* NODES */}
                     {others.map((node, i) => {
                         const angle = i * angleStep - Math.PI / 2;
                         const x = centerX + radius * Math.cos(angle);
                         const y = centerY + radius * Math.sin(angle);
                         const nodeColor = node.balance >= 0 ? (isDark ? '#1db954' : '#22c55e') : (isDark ? '#fa7970' : '#ef4444');

                         return (
                            <G key={`node-${i}`}>
                                <Circle cx={x} cy={y} r="20" fill={isDark ? "#212121" : "#f1f5f9"} stroke={nodeColor} strokeWidth="2" />
                                <SvgText x={x} y={y - 5} fill={textColor} fontSize="10" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                                    {node.name}
                                </SvgText>
                                <SvgText x={x} y={y + 8} fill={node.balance >= 0 ? (isDark ? '#1db954' : '#22c55e') : (isDark ? '#fa7970' : '#ef4444')} fontSize="9" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                                    {node.balance >= 0 ? '+' : ''}{Math.round(node.balance)}
                                </SvgText>
                            </G>
                         );
                     })}

                     {/* MY NODE */}
                     <Circle cx={myNode.x} cy={myNode.y} r={myNode.r} fill={myNode.color} />
                     <SvgText x={myNode.x} y={myNode.y - 6} fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">You</SvgText>
                     <SvgText x={myNode.x} y={myNode.y + 8} fill="#fff" fontSize="10" fontWeight="normal" textAnchor="middle" alignmentBaseline="middle">{myNode.subLabel}</SvgText>
                 </Svg>
             </View>
        </StyledView>
    );
}
