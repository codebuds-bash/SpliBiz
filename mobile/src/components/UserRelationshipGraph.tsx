import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Line, Polygon, Defs, Marker, G } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

// Types
interface Member {
    user_id: string;
    name: string;
    avatar_url?: string;
    role?: string;
}

interface Expense {
    id: string;
    created_by: string;
    amount: number;
    expense_payments: {
        user_id: string;
        paid_amount: number;
    }[];
    expense_splits: {
        user_id: string;
        share: number;
    }[];
}

interface Props {
    members: Member[];
    expenses: Expense[];
}

export default function UserRelationshipGraph({ members, expenses }: Props) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  // 0. Safety Checks
  if (!members || !user) return null;

  // 1. Layout Config
  const screenWidth = Dimensions.get('window').width - 40; // padding
  const size = screenWidth; // Square aspect ratio
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;

  // 2. Calculate Positions (Circle Layout)
  const nodes = useMemo(() => {
    return members.map((member, index) => {
        const total = members.length;
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { ...member, x, y };
    });
  }, [members, centerX, centerY, radius]);

  // 3. Calculate Global Graph Edges (copy of web logic)
  const graphEdges = useMemo(() => {
    if (!expenses) return [];
    
    const debts: Record<string, Record<string, number>> = {};
    members.forEach(m1 => {
        debts[m1.user_id] = {};
        members.forEach(m2 => { debts[m1.user_id][m2.user_id] = 0; });
    });

    expenses.forEach((expense) => {
      const payments = expense.expense_payments || [];
      const splits = expense.expense_splits || [];
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amount), 0);
      if (totalPaid === 0) return;

      payments.forEach((payment) => {
        const payerId = payment.user_id;
        const ratio = Number(payment.paid_amount) / totalPaid;

        splits.forEach((split) => {
          const debtorId = split.user_id;
          if (payerId !== debtorId) {
             const amountOwed = Number(split.share) * ratio;
             if (debts[debtorId] && debts[debtorId][payerId] !== undefined) {
                 debts[debtorId][payerId] += amountOwed;
             }
          }
        });
      });
    });

    const edges: { from: string; to: string; amount: number }[] = [];
    const processedPairs = new Set(); 

    members.forEach(m1 => {
        members.forEach(m2 => {
            if (m1.user_id === m2.user_id) return;
            const key = [m1.user_id, m2.user_id].sort().join('-');
            if (processedPairs.has(key)) return;
            processedPairs.add(key);

            const aOwesB = debts[m1.user_id][m2.user_id] || 0;
            const bOwesA = debts[m2.user_id][m1.user_id] || 0;
            const net = aOwesB - bOwesA;

            if (Math.abs(net) > 1) {
                if (net > 0) edges.push({ from: m1.user_id, to: m2.user_id, amount: net });
                else edges.push({ from: m2.user_id, to: m1.user_id, amount: Math.abs(net) });
            }
        });
    });
    return edges;
  }, [expenses, members]);

  return (
    <Card className="p-0 overflow-hidden mb-6 h-[400px] bg-gray-900 border-gray-800">
        <StyledView className="p-4 bg-gray-900/50">
            <StyledText className="text-white font-bold text-lg text-center">Relationship Web</StyledText>
        </StyledView>
        <View style={{ width: size, height: size, alignSelf: 'center' }}>
            <Svg height="100%" width="100%">
                <Defs>
                    <Marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <Polygon points="0,0 0,10 10,5" fill="#60A5FA" />
                    </Marker>
                </Defs>

                {/* Edges */}
                {graphEdges.map((edge, i) => {
                    const startNode = nodes.find(n => n.user_id === edge.from);
                    const endNode = nodes.find(n => n.user_id === edge.to);
                    if (!startNode || !endNode) return null;

                    const isMyConnection = edge.from === currentUserId || edge.to === currentUserId;
                    const strokeColor = isMyConnection ? "#60A5FA" : "rgba(255,255,255,0.1)";
                    const strokeWidth = isMyConnection ? 2 : 1;

                    return (
                        <G key={`edge-${i}`}>
                            <Line
                                x1={startNode.x}
                                y1={startNode.y}
                                x2={endNode.x}
                                y2={endNode.y}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                markerEnd={isMyConnection ? "url(#arrow)" : undefined}
                            />
                        </G>
                    )
                })}
            </Svg>

            {/* Nodes (Overlayed Absolute Views for better styling than SVG) */}
            {nodes.map(node => {
                const isMe = node.user_id === currentUserId;
                return (
                    <StyledView 
                        key={node.user_id}
                        className={`absolute items-center justify-center`}
                        style={{ 
                            left: node.x - 20, 
                            top: node.y - 20, 
                            width: 40, 
                            height: 40 
                        }}
                    >
                        <StyledView className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isMe ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
                             <StyledText className={`font-bold text-xs ${isMe ? 'text-blue-400' : 'text-gray-400'}`}>
                                {node.name.substring(0, 2).toUpperCase()}
                             </StyledText>
                        </StyledView>
                        {isMe && <StyledView className="absolute -bottom-5 bg-blue-500/20 px-2 py-0.5 rounded-full"><StyledText className="text-[10px] text-blue-300 font-bold">YOU</StyledText></StyledView>}
                    </StyledView>
                )
            })}
        </View>
    </Card>
  );
}

// Simple wrapper for Card import since we are inside a file & to avoid circular deps if any
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <StyledView className={`border rounded-xl ${className}`}>{children}</StyledView>
)
