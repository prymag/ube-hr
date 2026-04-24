import { useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from 'reactflow';
import { useUsers } from '../../features/users';
import { usePositions } from '../../features/positions';
import type { PositionResponse, UserResponse } from '@ube-hr/shared';

const POSITION_NODE_WIDTH = 260;
const STAFF_NODE_WIDTH = 220;
const POSITION_NODE_HEIGHT = 156;
const STAFF_NODE_HEIGHT = 108;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 96;

type OrgChartNodeKind = 'organization' | 'position' | 'staff';

interface OrgChartTreeNode {
  id: string;
  kind: OrgChartNodeKind;
  title: string;
  peopleLabel: string;
  departmentLabel: string;
  avatarUrl: string | null;
  positionsBelowCount: number;
  staffBelowCount: number;
  children: OrgChartTreeNode[];
}

interface OrgChartNodeData {
  kind: OrgChartNodeKind;
  title: string;
  peopleLabel: string;
  departmentLabel: string;
  avatarUrl: string | null;
  positionsBelowCount: number;
  staffBelowCount: number;
}

function sortPositions(positions: PositionResponse[]): PositionResponse[] {
  return [...positions].sort((left, right) => left.name.localeCompare(right.name));
}

function sortUsers(users: UserResponse[]): UserResponse[] {
  return [...users].sort((left, right) => {
    const leftLabel = left.name ?? left.email;
    const rightLabel = right.name ?? right.email;
    return leftLabel.localeCompare(rightLabel);
  });
}

function getNodeWidth(node: OrgChartTreeNode): number {
  return node.kind === 'staff' ? STAFF_NODE_WIDTH : POSITION_NODE_WIDTH;
}

function getNodeHeight(node: OrgChartTreeNode): number {
  return node.kind === 'staff' ? STAFF_NODE_HEIGHT : POSITION_NODE_HEIGHT;
}

function buildOrgRoots(
  positions: PositionResponse[],
  users: UserResponse[],
): OrgChartTreeNode[] {
  if (positions.length === 0) {
    return [];
  }

  const positionsById = new Map(positions.map((position) => [position.id, position]));
  const usersByPosition = new Map<number, UserResponse[]>();
  const childrenByParent = new Map<number, PositionResponse[]>();

  for (const user of users) {
    if (user.positionId === null) {
      continue;
    }

    const positionUsers = usersByPosition.get(user.positionId) ?? [];
    positionUsers.push(user);
    usersByPosition.set(user.positionId, positionUsers);
  }

  for (const [positionId, positionUsers] of usersByPosition.entries()) {
    usersByPosition.set(positionId, sortUsers(positionUsers));
  }

  for (const position of positions) {
    if (position.reportsToId === null || !positionsById.has(position.reportsToId)) {
      continue;
    }

    const children = childrenByParent.get(position.reportsToId) ?? [];
    children.push(position);
    childrenByParent.set(position.reportsToId, children);
  }

  for (const [parentId, children] of childrenByParent.entries()) {
    childrenByParent.set(parentId, sortPositions(children));
  }

  const staffBelowCache = new Map<number, number>();

  function countStaffBelow(positionId: number, lineage: Set<number>): number {
    if (lineage.has(positionId)) {
      return 0;
    }

    const cached = staffBelowCache.get(positionId);
    if (cached !== undefined) {
      return cached;
    }

    const nextLineage = new Set(lineage);
    nextLineage.add(positionId);

    const directUsers = usersByPosition.get(positionId)?.length ?? 0;
    const childPositions = childrenByParent.get(positionId) ?? [];
    const count = childPositions.reduce(
      (sum, childPosition) => sum + countStaffBelow(childPosition.id, nextLineage),
      directUsers,
    );

    staffBelowCache.set(positionId, count);
    return count;
  }

  function buildStaffNode(user: UserResponse, position: PositionResponse): OrgChartTreeNode {
    return {
      id: `staff-${user.id}`,
      kind: 'staff',
      title: user.name ?? user.email,
      peopleLabel: user.name ? user.email : position.name,
      departmentLabel: user.departmentName ?? 'No department assigned',
      avatarUrl: user.profilePicture,
      positionsBelowCount: 0,
      staffBelowCount: 0,
      children: [],
    };
  }

  function buildPositionNode(
    position: PositionResponse,
    lineage: Set<number>,
  ): OrgChartTreeNode {
    const nextLineage = new Set(lineage);
    nextLineage.add(position.id);

    const assignedUsers = usersByPosition.get(position.id) ?? [];
    const childPositions = (childrenByParent.get(position.id) ?? []).filter(
      (childPosition) => !nextLineage.has(childPosition.id),
    );
    const primaryUser = assignedUsers[0];

    const staffChildren = assignedUsers.map((user) => buildStaffNode(user, position));
    const positionChildren = childPositions.map((childPosition) =>
      buildPositionNode(childPosition, nextLineage),
    );
    const children = [...staffChildren, ...positionChildren];

    return {
      id: `position-${position.id}`,
      kind: 'position',
      title: position.name,
      peopleLabel:
        assignedUsers.length === 0
          ? 'Vacant position'
          : `${assignedUsers.length} assigned staff`,
      departmentLabel: primaryUser?.departmentName ?? 'No department assigned',
      avatarUrl: primaryUser?.profilePicture ?? null,
      positionsBelowCount: positionChildren.reduce(
        (sum, childNode) => sum + 1 + childNode.positionsBelowCount,
        0,
      ),
      staffBelowCount:
        staffChildren.length +
        childPositions.reduce(
          (sum, childPosition) => sum + countStaffBelow(childPosition.id, nextLineage),
          0,
        ),
      children,
    };
  }

  const rootPositions = sortPositions(
    positions.filter(
      (position) =>
        position.reportsToId === null || !positionsById.has(position.reportsToId),
    ),
  );

  const effectiveRoots =
    rootPositions.length > 0 ? rootPositions : sortPositions(positions);
  const rootNodes = effectiveRoots.map((position) =>
    buildPositionNode(position, new Set<number>()),
  );

  if (rootNodes.length === 1) {
    return rootNodes;
  }

  return [
    {
      id: 'organization-root',
      kind: 'organization',
      title: 'Organization',
      peopleLabel: `${users.length} assigned staff`,
      departmentLabel: 'Multiple reporting roots',
      avatarUrl: null,
      positionsBelowCount: rootNodes.reduce(
        (sum, rootNode) => sum + 1 + rootNode.positionsBelowCount,
        0,
      ),
      staffBelowCount: rootNodes.reduce(
        (sum, rootNode) => sum + rootNode.staffBelowCount,
        0,
      ),
      children: rootNodes,
    },
  ];
}

function measureSubtree(node: OrgChartTreeNode): number {
  if (node.children.length === 0) {
    return getNodeWidth(node);
  }

  const childrenWidth = node.children.reduce(
    (sum, child, index) =>
      sum + measureSubtree(child) + (index > 0 ? HORIZONTAL_GAP : 0),
    0,
  );

  return Math.max(getNodeWidth(node), childrenWidth);
}

function buildDepthOffsets(roots: OrgChartTreeNode[]): Map<number, number> {
  const maxHeightByDepth = new Map<number, number>();

  function collect(node: OrgChartTreeNode, depth: number) {
    const currentMax = maxHeightByDepth.get(depth) ?? 0;
    maxHeightByDepth.set(depth, Math.max(currentMax, getNodeHeight(node)));

    for (const child of node.children) {
      collect(child, depth + 1);
    }
  }

  for (const root of roots) {
    collect(root, 0);
  }

  const depths = [...maxHeightByDepth.keys()].sort((left, right) => left - right);
  const depthOffsets = new Map<number, number>();
  let nextOffset = 0;

  for (const depth of depths) {
    depthOffsets.set(depth, nextOffset);
    nextOffset += (maxHeightByDepth.get(depth) ?? 0) + VERTICAL_GAP;
  }

  return depthOffsets;
}

function createFlowElements(
  roots: OrgChartTreeNode[],
): { edges: Edge[]; nodes: Node<OrgChartNodeData>[] } {
  const nodes: Node<OrgChartNodeData>[] = [];
  const edges: Edge[] = [];
  const depthOffsets = buildDepthOffsets(roots);

  function placeNode(node: OrgChartTreeNode, left: number, depth: number): number {
    const nodeWidth = getNodeWidth(node);
    const subtreeWidth = measureSubtree(node);
    const x = left + (subtreeWidth - nodeWidth) / 2;
    const y = depthOffsets.get(depth) ?? 0;

    nodes.push({
      id: node.id,
      type: 'orgChart',
      position: { x, y },
      data: {
        kind: node.kind,
        title: node.title,
        peopleLabel: node.peopleLabel,
        departmentLabel: node.departmentLabel,
        avatarUrl: node.avatarUrl,
        positionsBelowCount: node.positionsBelowCount,
        staffBelowCount: node.staffBelowCount,
      },
      draggable: false,
      selectable: false,
    });

    let childLeft = left;
    for (const child of node.children) {
      const childWidth = placeNode(child, childLeft, depth + 1);
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: 'smoothstep',
        animated: false,
      });
      childLeft += childWidth + HORIZONTAL_GAP;
    }

    return subtreeWidth;
  }

  let rootLeft = 0;
  for (const root of roots) {
    const rootWidth = placeNode(root, rootLeft, 0);
    rootLeft += rootWidth + HORIZONTAL_GAP;
  }

  return { edges, nodes };
}

function OrgChartFlowNode({ data }: NodeProps<OrgChartNodeData>) {
  const isStaffNode = data.kind === 'staff';
  const isOrganizationNode = data.kind === 'organization';
  const initials = data.title.trim().slice(0, 2).toUpperCase();

  return (
    <>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-border" />
      <div
        className={
          isStaffNode
            ? 'w-[220px] rounded-xl border bg-card p-3 shadow-sm'
            : 'w-[260px] rounded-xl border bg-card p-4 shadow-sm'
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt={data.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials || 'VC'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{data.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{data.peopleLabel}</p>
            <p className="mt-2 truncate text-xs uppercase tracking-wide text-muted-foreground">
              {data.departmentLabel}
            </p>
          </div>
        </div>

        {!isStaffNode && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex flex-col">
              <span>Positions below</span>
              <span className="font-semibold text-foreground">
                {data.positionsBelowCount}
              </span>
            </div>
            <div className="text-right">
              <span>{isOrganizationNode ? 'Staff in chart' : 'Staff below'}</span>
              <div className="font-semibold text-foreground">{data.staffBelowCount}</div>
            </div>
          </div>
        )}
      </div>
      {!isStaffNode && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !bg-border"
        />
      )}
    </>
  );
}

const nodeTypes: NodeTypes = {
  orgChart: OrgChartFlowNode,
};

function OrgChartViewportSync({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodeCount === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      void fitView({
        padding: 0.35,
        minZoom: 0.05,
        maxZoom: 1.2,
        duration: 250,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [fitView, nodeCount]);

  return null;
}

export function OrgChartPage() {
  const { data: positionsData, isPending: positionsPending } = usePositions({
    pageSize: 1000,
  });
  const { data: usersData, isPending: usersPending } = useUsers({
    pageSize: 1000,
  });

  const isLoading = positionsPending || usersPending;

  const flowElements = useMemo(() => {
    const positions = positionsData?.data ?? [];
    const users = usersData?.data ?? [];
    const roots = buildOrgRoots(positions, users);
    return createFlowElements(roots);
  }, [positionsData, usersData]);

  const positions = positionsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading organization chart...</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Organization Chart</h1>
        </div>
        <div className="flex h-64 items-center justify-center rounded-lg border bg-background">
          <p className="text-muted-foreground">
            No positions defined. Create positions to build the org chart.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Organization Chart</h1>
        <p className="mt-1 text-muted-foreground">
          Organizational structure based on position hierarchy
        </p>
      </div>
      <div
        className="overflow-hidden rounded-lg border bg-background"
        style={{ height: 'calc(100vh - 220px)' }}
      >
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowElements.nodes}
            edges={flowElements.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.35, minZoom: 0.05, maxZoom: 1.2 }}
            minZoom={0.05}
            maxZoom={1.5}
            nodesConnectable={false}
            nodesDraggable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              style: { stroke: 'hsl(var(--border))', strokeWidth: 1.5 },
            }}
          >
            <OrgChartViewportSync nodeCount={flowElements.nodes.length} />
            <Controls showInteractive={false} />
            <Background color="hsl(var(--border))" gap={20} size={1} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
