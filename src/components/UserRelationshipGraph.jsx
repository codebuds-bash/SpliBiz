import React, { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function UserRelationshipGraph({ members, balances, expenses }) {
  const { user } = useAuth();

  // 1. Identify Current User
  const currentUserId = user?.id;
  const currentUserMember = members.find((m) => m.user_id === currentUserId);

  // 2. Filter Other Members
  const otherMembers = useMemo(() => {
    return members.filter((m) => m.user_id !== currentUserId);
  }, [members, currentUserId]);

  // 3. Calculate Pairwise Debts relative to Current User (Direct History)
  // "Add up splits of amount paid among or paid by them"
  const pairwiseBalances = useMemo(() => {
    const pb = {};
    if (!expenses || !currentUserId) return pb;

    // Initialize balance for all members
    members.forEach((m) => (pb[m.user_id] = 0));

    expenses.forEach((expense) => {
      const payments = expense.expense_payments || [];
      const splits = expense.expense_splits || [];
      
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amount), 0);
      if (totalPaid === 0) return;

      // For every payment P (by Payer), and every split S (by Debtor)
      // The Debtor (S) owes Payer (P): S.share * (P.paid / TotalPaid)
      
      payments.forEach((payment) => {
        const payerId = payment.user_id;
        const paidAmount = Number(payment.paid_amount);
        const ratio = paidAmount / totalPaid; // Fraction of the bill this payer covered

        splits.forEach((split) => {
          const debtorId = split.user_id;
          const shareAmount = Number(split.share);
          const amountOwedToPayer = shareAmount * ratio;

          // We only care if "Me" is involved as Payer or Debtor
          
          // Case A: I am the Payer. Debtor owes Me.
          if (payerId === currentUserId && debtorId !== currentUserId) {
             pb[debtorId] = (pb[debtorId] || 0) + amountOwedToPayer;
          }

          // Case B: I am the Debtor. I owe Payer.
          if (debtorId === currentUserId && payerId !== currentUserId) {
             pb[payerId] = (pb[payerId] || 0) - amountOwedToPayer;
          }
        });
      });
    });

    return pb;
  }, [expenses, currentUserId, members]);


  if (!currentUserMember) return null;

  // 4. Layout Configuration
  const centerX = 50; // percentage
  const centerY = 50; // percentage
  const radius = 35; // percentage of container (relative to smaller dimension)

  // 5. Calculate Positions
  const nodes = otherMembers.map((member, index) => {
    const angle = (index / otherMembers.length) * 2 * Math.PI - Math.PI / 2; // Start from top (-90deg)
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { ...member, x, y };
  });

  // 6. Web/Spider Chart Background Calculation REMOVED

  const getAvatar = (member) => {
    if (member.avatar_url) {
      return (
        <img
          src={member.avatar_url}
          alt={member.name}
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-xs">
        {member.name?.substring(0, 2).toUpperCase()}
      </div>
    );
  };


  return (
    <div className="card p-0 overflow-hidden relative min-h-[450px] flex flex-col bg-gradient-to-b from-[#1c1c1c] to-[#0f0f0f]">
      {/* Background Grid/Effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="p-6 pb-2 z-10 relative text-center">
        <h3 className="text-lg font-semibold text-white tracking-wide ">
            Relationship Web
        </h3>
      </div>

      <div className="relative w-full flex-1 min-h-[400px] max-w-lg mx-auto flex items-center justify-center">
        
        {/* SVG Layer for Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
             <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.8" />
             </linearGradient>
             <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F87171" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#F87171" stopOpacity="0.8" />
             </linearGradient>
             <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
             </filter>
          </defs>

          {/* --- ACTIVE DEBT LINES --- */}
          {nodes.map((node) => {
            const balance = pairwiseBalances[node.user_id] || 0;
            const isPositive = balance >= 0;
            const strokeColor = isPositive ? "#4ADE80" : "#F87171";
            
            // Don't draw line if settled (0)
            if (Math.abs(balance) < 1) return null;

            return (
              <g key={`line-${node.user_id}`}>
                {/* Glow Effect Line */}
                <line
                  x1={`${centerX}%`}
                  y1={`${centerY}%`}
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke={strokeColor}
                  strokeWidth="3"
                  strokeOpacity="0.2"
                  filter="url(#glow)"
                />
                {/* Core Line */}
                <line
                  x1={`${centerX}%`}
                  y1={`${centerY}%`}
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={isPositive ? "none" : "5 3"}
                />
                
                {/* Moving Particle Animation along the line */}
                 <circle r="3" fill={strokeColor}>
                    <animateMotion 
                        dur="2s" 
                        repeatCount="indefinite"
                        path={`M ${isPositive ? node.x : centerX} ${isPositive ? node.y : centerY} L ${isPositive ? centerX : node.x} ${isPositive ? centerY : node.y}`} 
                    />
                 </circle>
              </g>
            );
          })}
        </svg>

        {/* Central Node (Me) */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
          style={{ left: `${centerX}%`, top: `${centerY}%` }}
        >
          <div className="relative">
             <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
             <div className="w-16 h-16 rounded-full border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.5)] overflow-hidden bg-[#2a2a2a] relative z-10">
                {getAvatar(currentUserMember)}
             </div>
          </div>
          <div className="mt-2 bg-[#1a1a1a]/90 border border-blue-500/30 px-3 py-0.5 rounded-full text-[10px] text-blue-200 font-bold backdrop-blur-md shadow-lg tracking-wider uppercase">
            You
          </div>
        </div>

        {/* Leaf Nodes (Others) */}
        {nodes.map((node) => {
           const balance = pairwiseBalances[node.user_id] || 0;
           const isPositive = balance >= 0;
           const isSettled = Math.abs(balance) < 1;
           
           return (
            <div
                key={node.user_id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center transition-all duration-500 group"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
                {/* Connection Dot on Line Intersection (Aesthetic) */}
                {!isSettled && (
                     <div className={`absolute top-1/2 left-1/2 w-32 h-[1px] -z-10 bg-gradient-to-r ${isPositive ? 'from-green-500/0 via-green-500/50 to-transparent' : 'from-red-500/0 via-red-500/50 to-transparent'} transform origin-left opacity-0 group-hover:opacity-100 transition-opacity`}
                          style={{ transform: `rotate(${Math.atan2(centerY - node.y, centerX - node.x)}rad)` }}>
                     </div>
                )}

                <div className={`w-14 h-14 rounded-full border-2 transition-transform duration-300 hover:scale-110 overflow-hidden shadow-lg 
                    ${isSettled 
                        ? 'border-gray-600/30 grayscale opacity-70' 
                        : (isPositive ? 'border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'border-red-500/50 shadow-[0_0_15px_rgba(248,113,113,0.2)]')
                    } bg-[#2a2a2a]`}>
                    {getAvatar(node)}
                </div>
                
                {/* Info Card */}
                <div className="mt-2 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-200 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md whitespace-nowrap border border-white/5">
                        {node.name.split(" ")[0]}
                    </span>
                    
                    {!isSettled ? (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm backdrop-blur-sm
                            ${isPositive 
                                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                            <span>{isPositive ? "Take" : "Pay"}</span>
                            <span>₹{Math.abs(balance).toFixed(0)}</span>
                        </div>
                    ) : (
                         <span className="text-[10px] text-gray-500 font-medium">Settled</span>
                    )}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
