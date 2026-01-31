import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { Svg, Line, Defs, Marker, Polygon } from 'react-native-svg';
import { styled } from 'nativewind';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

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
    
    // --- 1. Calculate Pairwise Balances (Direct History) ---
    // "Add up splits of amount paid among or paid by them"
    const pairwiseBalances = useMemo(() => {
        const pb: Record<string, number> = {};
        if (!expenses || !user) return pb;

        // Initialize balance for all members
        members.forEach((m) => (pb[m.user_id] = 0));

        expenses.forEach((expense) => {
            const payments = expense.expense_payments || [];
            const splits = expense.expense_splits || [];
            
            const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.paid_amount), 0);
            if (totalPaid === 0) return;

            // For every payment P (by Payer), and every split S (by Debtor)
            // The Debtor (S) owes Payer (P): S.share * (P.paid / TotalPaid)
            
            payments.forEach((payment: any) => {
                const payerId = payment.user_id;
                const paidAmount = Number(payment.paid_amount);
                const ratio = paidAmount / totalPaid; // Fraction of the bill this payer covered

                splits.forEach((split: any) => {
                    const debtorId = split.user_id;
                    const shareAmount = Number(split.share);
                    const amountOwedToPayer = shareAmount * ratio;

                    // We only care if "Me" is involved as Payer or Debtor
                    
                    // Case A: I am the Payer. Debtor owes Me. (Positive for specific debtor)
                    if (payerId === user.id && debtorId !== user.id) {
                        pb[debtorId] = (pb[debtorId] || 0) + amountOwedToPayer;
                    }

                    // Case B: I am the Debtor. I owe Payer. (Negative for specific payer)
                    if (debtorId === user.id && payerId !== user.id) {
                        pb[payerId] = (pb[payerId] || 0) - amountOwedToPayer;
                    }
                });
            });
        });

        return pb;
    }, [expenses, members, user]);

    // --- 2. Relationship Mapping ---
    const currentUserMember = useMemo(() => members.find(m => m.user_id === user?.id), [members, user]);

    const relationships = useMemo(() => {
        if (!user) return [];
        return members.filter(m => m.user_id !== user.id).map(m => ({
            id: m.user_id,
            name: m.name.split(' ')[0],
            fullName: m.name,
            avatar_url: m.avatar_url,
            balance: pairwiseBalances[m.user_id] || 0
        }));
    }, [pairwiseBalances, members, user]);

    // --- 3. Layout Logic ---
    const width = 340; // Keep width constrained for mobile screens
    const height = 380; // Significantly increased height
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 135; // Increased radius to spread nodes apart

    // Current User Node
    // My Net Balance is the sum of what everyone opposes me (Positive = They owe me, Negative = I owe them)
    // improving readability: Sum of all pairwise numeric values
    const myBalance = Object.values(pairwiseBalances).reduce((acc: number, val: number) => acc + val, 0);
    const myNode = {
        x: centerX,
        y: centerY,
        r: 25,
        color: myBalance >= 0 ? '#1db954' : '#ef4444',
        label: "You",
        subLabel: `₹${Math.abs(myBalance).toFixed(0)}`,
        avatar_url: currentUserMember?.avatar_url,
        name: currentUserMember?.name || "You"
    };

    const others = relationships;
    const angleStep = (2 * Math.PI) / (others.length || 1);
    
    // Colors
    const lineColor = isDark ? "#535353" : "#e2e8f0";
    const textColor = isDark ? "#ffffff" : "#0f172a";

    // Helper to render Avatar Circles
    const AvatarNode = ({ x, y, r, avatar, name, borderColor, initialsColor }: any) => {
        const size = r * 2;
        return (
            <StyledView 
                className="absolute justify-center items-center" 
                style={{ 
                    left: x - r, 
                    top: y - r, 
                    width: size, 
                    height: size,
                }}
            >
                <StyledView 
                    className="overflow-hidden justify-center items-center"
                    style={{
                        width: size,
                        height: size,
                        borderRadius: r,
                        borderWidth: 2,
                        borderColor: borderColor,
                        backgroundColor: isDark ? "#212121" : "#f1f5f9"
                    }}
                >
                    {avatar ? (
                        <StyledImage 
                            source={{ uri: avatar }} 
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <StyledText className="font-bold text-center" style={{ fontSize: r * 0.6, color: initialsColor }}>
                            {name?.substring(0, 2).toUpperCase()}
                        </StyledText>
                    )}
                </StyledView>
            </StyledView>
        );
    };

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

             <View style={{ width, height, alignSelf: 'center' }}>
                 {/* LINES (Keeping SVG for logic lines) */}
                 <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
                     <Defs>
                        <Marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <Polygon points="0 0, 10 5, 0 10" fill={isDark ? "#b3b3b3" : "#94a3b8"} />
                        </Marker>
                     </Defs>

                     {others.map((node, i) => {
                         const angle = i * angleStep - Math.PI / 2;
                         const x = centerX + radius * Math.cos(angle);
                         const y = centerY + radius * Math.sin(angle);
                         
                         const balance = node.balance;
                         const isPositive = balance >= 0;
                         const isSettled = Math.abs(balance) < 1;
                         
                         let stroke = lineColor;
                         let dashArray = "4"; // Default dashed

                         if (!isSettled) {
                             if (isPositive) {
                                 stroke = isDark ? "#1db954" : "#22c55e";
                                 dashArray = "0"; // Solid
                             } else {
                                 stroke = isDark ? "#fa7970" : "#ef4444";
                                 dashArray = "4"; // Dashed
                             }
                         }
                          
                         return (
                            <Line key={`line-${i}`} x1={myNode.x} y1={myNode.y} x2={x} y2={y} stroke={stroke} strokeWidth="2" strokeDasharray={dashArray} />
                         );
                     })}
                 </Svg>

                 {/* NODES (Using Views for easier image handling) */}
                 {others.map((node, i) => {
                     const angle = i * angleStep - Math.PI / 2;
                     const x = centerX + radius * Math.cos(angle);
                     const y = centerY + radius * Math.sin(angle);
                     const nodeColor = node.balance >= 0 ? (isDark ? '#1db954' : '#22c55e') : (isDark ? '#fa7970' : '#ef4444');

                     return (
                        <React.Fragment key={`node-${i}`}>
                             <AvatarNode 
                                x={x} 
                                y={y} 
                                r={20} 
                                avatar={node.avatar_url} 
                                name={node.name} 
                                borderColor={nodeColor}
                                initialsColor={textColor}
                            />
                            {/* Labels overlaid safely */}
                            <StyledView className="absolute items-center justify-center pointer-events-none" style={{ left: x - 40, top: y + 22, width: 80 }}>
                                <StyledText className="text-[10px] font-bold text-center" numberOfLines={1} style={{ color: textColor }}>
                                    {node.name}
                                </StyledText>
                                <StyledText className="text-[9px] font-bold text-center" style={{ color: nodeColor }}>
                                    {node.balance >= 0 ? '+' : ''}{Math.round(node.balance)}
                                </StyledText>
                            </StyledView>
                        </React.Fragment>
                     );
                 })}

                 {/* MY NODE */}
                 <AvatarNode 
                    x={myNode.x} 
                    y={myNode.y} 
                    r={myNode.r} 
                    avatar={myNode.avatar_url} 
                    name={myNode.name} 
                    borderColor={myNode.color}
                    initialsColor={textColor}
                 />
                 <StyledView className="absolute items-center justify-center pointer-events-none" style={{ left: myNode.x - 40, top: myNode.y + 28, width: 80 }}>
                     <StyledText className="text-xs font-bold text-center" style={{ color: textColor }}>You</StyledText>
                     <StyledText className="text-[10px] font-normal text-center" style={{ color: textColor }}>{myNode.subLabel}</StyledText>
                 </StyledView>
             </View>
        </StyledView>
    );
}
