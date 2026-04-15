'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import FulfillmentCard, { type FulfillmentCardData } from './FulfillmentCard';
import { Package } from 'lucide-react';

interface BoardData {
  toPack: FulfillmentCardData[];
  labelGenerated: FulfillmentCardData[];
  inTransit: FulfillmentCardData[];
  delivered: FulfillmentCardData[];
}

const COLUMNS = [
  { id: 'toPack', label: 'To Pack', status: 'verified', color: 'blue' },
  { id: 'labelGenerated', label: "Label Gen'd", status: 'processing', color: 'amber' },
  { id: 'inTransit', label: 'In Transit', status: 'shipped', color: 'purple' },
  { id: 'delivered', label: 'Delivered', status: 'completed', color: 'green' },
] as const;

const statusOrder = ['verified', 'processing', 'shipped', 'completed'];

function DroppableColumn({
  id,
  label,
  color,
  status,
  cards,
  isOverTarget,
}: {
  id: string;
  label: string;
  color: string;
  status: string;
  cards: FulfillmentCardData[];
  isOverTarget: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const highlight = isOver || isOverTarget;

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-[400px] rounded-sm border transition-all ${
        highlight
          ? 'border-dashed border-accent/60 bg-accent/5'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className={`px-4 py-3 border-b border-white/10 flex items-center justify-between`}>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">
          {label}
        </h3>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${colorMap[color]}`}
        >
          {cards.length}
        </span>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
        <SortableContext
          items={cards.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-white/10">
              <Package size={24} />
              <p className="text-[8px] uppercase tracking-widest mt-2">No orders</p>
            </div>
          ) : (
            cards.map((card) => (
              <FulfillmentCard key={card._id} card={card} columnStatus={status} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function FulfillmentBoard({
  data,
  workosUserId,
}: {
  data: BoardData;
  workosUserId: string;
}) {
  const [board, setBoard] = useState<BoardData>(data);
  const [activeCard, setActiveCard] = useState<FulfillmentCardData | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [lastData, setLastData] = useState(data);

  const updateOrderStatus = useMutation(api.orders.updateFulfillmentStatus);
  const updatePreOrderStatus = useMutation(api.preOrders.updateFulfillmentStatus);

  // Keep board in sync with server data
  if (data !== lastData) {
    setLastData(data);
    setBoard(data);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const findColumn = useCallback(
    (cardId: string): string | null => {
      for (const col of COLUMNS) {
        if (board[col.id].some((c) => c._id === cardId)) return col.id;
      }
      return null;
    },
    [board]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current?.card as FulfillmentCardData | undefined;
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragEndEvent) => {
    const { over } = event;
    if (over) {
      // over.id could be a column id or a card id
      const colId = COLUMNS.find((c) => c.id === over.id)?.id || findColumn(over.id as string);
      setOverColumn(colId);
    } else {
      setOverColumn(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    setOverColumn(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const card = active.data.current?.card as FulfillmentCardData;
    if (!card) return;

    // Determine target column
    const targetColId =
      COLUMNS.find((c) => c.id === over.id)?.id || findColumn(over.id as string);
    if (!targetColId) return;

    const sourceColId = findColumn(activeId);
    if (!sourceColId || sourceColId === targetColId) return;

    const targetCol = COLUMNS.find((c) => c.id === targetColId)!;
    const sourceCol = COLUMNS.find((c) => c.id === sourceColId)!;

    // Forward-only check
    const sourceIdx = statusOrder.indexOf(sourceCol.status);
    const targetIdx = statusOrder.indexOf(targetCol.status);
    if (targetIdx <= sourceIdx) return;

    // Optimistic update
    const prevBoard = { ...board };
    setBoard((prev) => {
      const updated = { ...prev };
      updated[sourceColId as keyof BoardData] = prev[sourceColId as keyof BoardData].filter(
        (c) => c._id !== activeId
      );
      updated[targetColId as keyof BoardData] = [
        { ...card, orderStatus: targetCol.status },
        ...prev[targetColId as keyof BoardData],
      ];
      return updated;
    });

    try {
      if (card.type === 'pre-order') {
        const preOrderStatusMap: Record<string, string> = {
          verified: 'balance_verified',
          shipped: 'shipped',
          completed: 'delivered',
        };
        await updatePreOrderStatus({
          workosUserId,
          preOrderId: activeId as Id<'preOrders'>,
          newStatus: preOrderStatusMap[targetCol.status] as any,
        });
      } else {
        await updateOrderStatus({
          workosUserId,
          orderId: activeId as Id<'orders'>,
          newStatus: targetCol.status as any,
        });
      }
    } catch {
      // Revert on failure
      setBoard(prevBoard);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            status={col.status}
            cards={board[col.id]}
            isOverTarget={overColumn === col.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="opacity-90 rotate-2 scale-105">
            <FulfillmentCard card={activeCard} columnStatus={activeCard.orderStatus} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
