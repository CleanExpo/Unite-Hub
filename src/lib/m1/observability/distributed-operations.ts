/**
 * M1 Distributed Operations Manager
 *
 * Manages distributed system operations including consensus,
 * leader election, distributed locking, and eventual consistency
 *
 * Version: v3.1.0
 * Phase: 18B - Distributed System Operations
 */

import { v4 as generateUUID } from 'uuid';

export type NodeState = 'follower' | 'candidate' | 'leader' | 'unavailable';
export type OperationType = 'read' | 'write' | 'transactional' | 'distributed_transaction';
export type ConsensusAlgorithm = 'raft' | 'paxos' | 'pbft';
export type LockMode = 'shared' | 'exclusive' | 'intent_shared' | 'intent_exclusive';

/**
 * Cluster node
 */
export interface ClusterNode {
  id: string;
  address: string;
  port: number;
  state: NodeState;
  term: number;
  lastHeartbeat: number;
  isAlive: boolean;
  commitIndex: number;
  lastLogIndex: number;
  priority: number;
}

/**
 * Consensus state
 */
export interface ConsensusState {
  currentTerm: number;
  votedFor?: string;
  log: Array<{ term: number; command: unknown; timestamp: number }>;
  commitIndex: number;
  lastApplied: number;
}

/**
 * Leader state
 */
export interface LeaderState {
  leaderId: string;
  term: number;
  electedAt: number;
  nextIndices: Map<string, number>;
  matchIndices: Map<string, number>;
  heartbeatInterval: number;
}

/**
 * Distributed lock
 */
export interface DistributedLock {
  id: string;
  resource: string;
  mode: LockMode;
  owner: string;
  acquiredAt: number;
  expiresAt: number;
  waitQueue: Array<{
    requesterId: string;
    mode: LockMode;
    requestedAt: number;
  }>;
}

/**
 * Distributed transaction
 */
export interface DistributedTransaction {
  id: string;
  status: 'prepared' | 'committed' | 'aborted' | 'rolled_back';
  coordinator: string;
  participants: Set<string>;
  startedAt: number;
  preparedAt?: number;
  completedAt?: number;
  operations: Array<{
    id: string;
    type: OperationType;
    resource: string;
    data: unknown;
  }>;
}

/**
 * Replication state
 */
export interface ReplicationState {
  nodeId: string;
  sequence: number;
  data: unknown;
  replicated: Map<string, number>; // nodeId -> confirmed sequence
  consistency: 'eventual' | 'strong' | 'causal';
}

/**
 * Distributed Operations Manager
 */
export class DistributedOperationsManager {
  private nodes: Map<string, ClusterNode> = new Map();
  private consensus: ConsensusState = {
    currentTerm: 0,
    log: [],
    commitIndex: 0,
    lastApplied: 0,
  };
  private leaderState?: LeaderState;
  private locks: Map<string, DistributedLock> = new Map();
  private transactions: Map<string, DistributedTransaction> = new Map();
  private replicationLog: Map<string, ReplicationState[]> = new Map();
  private algorithm: ConsensusAlgorithm = 'raft';
  private nodeId: string;
  private electionTimeout: number = 3000; // 3 seconds

  constructor(nodeId?: string, algorithm: ConsensusAlgorithm = 'raft') {
    this.nodeId = nodeId || `node_${generateUUID()}`;
    this.algorithm = algorithm;
  }

  /**
   * Register cluster node
   */
  registerNode(
    address: string,
    port: number,
    priority: number = 1
  ): string {
    const id = `node_${generateUUID()}`;
    const node: ClusterNode = {
      id,
      address,
      port,
      state: 'follower',
      term: 0,
      lastHeartbeat: Date.now(),
      isAlive: true,
      commitIndex: 0,
      lastLogIndex: 0,
      priority,
    };

    this.nodes.set(id, node);
    return id;
  }

  /**
   * Update node state
   */
  updateNodeState(nodeId: string, state: NodeState): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
return false;
}

    node.state = state;
    node.lastHeartbeat = Date.now();
    return true;
  }

  /**
   * Start leader election
   */
  startLeaderElection(): { elected: boolean; leaderId?: string } {
    const aliveNodes = Array.from(this.nodes.values()).filter((n) => n.isAlive);

    if (aliveNodes.length === 0) {
      return { elected: false };
    }

    // Sort by priority (higher priority first)
    aliveNodes.sort((a, b) => b.priority - a.priority);

    // Current implementation: elect highest priority node
    const elected = aliveNodes[0];
    this.consensus.currentTerm++;
    this.consensus.votedFor = elected.id;

    elected.state = 'leader';
    elected.term = this.consensus.currentTerm;

    this.leaderState = {
      leaderId: elected.id,
      term: this.consensus.currentTerm,
      electedAt: Date.now(),
      nextIndices: new Map(
        aliveNodes.map((n) => [n.id, this.consensus.log.length])
      ),
      matchIndices: new Map(aliveNodes.map((n) => [n.id, 0])),
      heartbeatInterval: 500, // 500ms
    };

    // Update other nodes to followers
    for (const node of aliveNodes) {
      if (node.id !== elected.id) {
        node.state = 'follower';
        node.term = this.consensus.currentTerm;
      }
    }

    return { elected: true, leaderId: elected.id };
  }

  /**
   * Append log entry
   */
  appendLogEntry(command: unknown): boolean {
    if (!this.leaderState) {
return false;
}

    const entry = {
      term: this.consensus.currentTerm,
      command,
      timestamp: Date.now(),
    };

    this.consensus.log.push(entry);
    return true;
  }

  /**
   * Commit log entries
   */
  commitLogEntries(count: number): number {
    const previousCommit = this.consensus.commitIndex;
    this.consensus.commitIndex = Math.min(
      this.consensus.commitIndex + count,
      this.consensus.log.length
    );

    return this.consensus.commitIndex - previousCommit;
  }

  /**
   * Acquire distributed lock
   */
  acquireLock(
    resource: string,
    requesterId: string,
    mode: LockMode = 'exclusive',
    timeoutMs: number = 5000
  ): string | null {
    const lockId = `lock_${generateUUID()}`;
    const expiresAt = Date.now() + timeoutMs;

    const lock: DistributedLock = {
      id: lockId,
      resource,
      mode,
      owner: requesterId,
      acquiredAt: Date.now(),
      expiresAt,
      waitQueue: [],
    };

    const resourceLocks = Array.from(this.locks.values()).filter(
      (l) => l.resource === resource && !this.isLockExpired(l.id)
    );

    // Check for conflicts
    for (const existingLock of resourceLocks) {
      if (this.hasLockConflict(existingLock.mode, mode)) {
        // Add to wait queue
        lock.waitQueue.push({
          requesterId,
          mode,
          requestedAt: Date.now(),
        });

        this.locks.set(lockId, lock);
        return null; // Not acquired, waiting
      }
    }

    this.locks.set(lockId, lock);
    return lockId;
  }

  /**
   * Release distributed lock
   */
  releaseLock(lockId: string): boolean {
    const lock = this.locks.get(lockId);
    if (!lock) {
return false;
}

    this.locks.delete(lockId);

    // Process wait queue
    if (lock.waitQueue.length > 0) {
      const next = lock.waitQueue.shift();
      if (next) {
        this.acquireLock(lock.resource, next.requesterId, next.mode);
      }
    }

    return true;
  }

  /**
   * Start distributed transaction (Two-Phase Commit)
   */
  startDistributedTransaction(
    participants: Set<string>,
    operations: DistributedTransaction['operations']
  ): string {
    const txnId = `txn_${generateUUID()}`;

    const transaction: DistributedTransaction = {
      id: txnId,
      status: 'prepared',
      coordinator: this.nodeId,
      participants,
      startedAt: Date.now(),
      operations,
    };

    this.transactions.set(txnId, transaction);
    return txnId;
  }

  /**
   * Prepare transaction (Phase 1)
   */
  prepareTransaction(txnId: string): { canCommit: boolean; nodeVotes: Map<string, boolean> } {
    const txn = this.transactions.get(txnId);
    if (!txn || txn.status !== 'prepared') {
      return { canCommit: false, nodeVotes: new Map() };
    }

    const nodeVotes = new Map<string, boolean>();

    // Simulate vote from each participant
    for (const participantId of txn.participants) {
      const canCommit = Math.random() > 0.1; // 90% success rate
      nodeVotes.set(participantId, canCommit);
    }

    const canCommitAll = Array.from(nodeVotes.values()).every((v) => v);
    txn.preparedAt = Date.now();

    return { canCommit: canCommitAll, nodeVotes };
  }

  /**
   * Commit transaction (Phase 2)
   */
  commitTransaction(txnId: string): boolean {
    const txn = this.transactions.get(txnId);
    if (!txn) {
return false;
}

    txn.status = 'committed';
    txn.completedAt = Date.now();

    return true;
  }

  /**
   * Abort transaction
   */
  abortTransaction(txnId: string, reason?: string): boolean {
    const txn = this.transactions.get(txnId);
    if (!txn) {
return false;
}

    txn.status = 'aborted';
    txn.completedAt = Date.now();

    return true;
  }

  /**
   * Replicate data
   */
  replicateData(
    resource: string,
    data: unknown,
    consistency: ReplicationState['consistency'] = 'eventual'
  ): string {
    const sequence = this.replicationLog.get(resource)?.length || 0;

    const replicationState: ReplicationState = {
      nodeId: this.nodeId,
      sequence,
      data,
      replicated: new Map(),
      consistency,
    };

    const log = this.replicationLog.get(resource) || [];
    log.push(replicationState);
    this.replicationLog.set(resource, log);

    return `${resource}:${sequence}`;
  }

  /**
   * Confirm replication on node
   */
  confirmReplication(resource: string, sequence: number, nodeId: string): boolean {
    const log = this.replicationLog.get(resource);
    if (!log || sequence >= log.length) {
return false;
}

    const state = log[sequence];
    state.replicated.set(nodeId, Date.now());

    return true;
  }

  /**
   * Check replication consistency
   */
  getReplicationStatus(resource: string): {
    totalSequences: number;
    replicatedSequences: number;
    consistency: string;
  } {
    const log = this.replicationLog.get(resource) || [];

    const replicatedSequences = log.filter((s) => s.replicated.size > 0).length;

    return {
      totalSequences: log.length,
      replicatedSequences,
      consistency: log[log.length - 1]?.consistency || 'unknown',
    };
  }

  /**
   * Get cluster status
   */
  getClusterStatus(): {
    leader?: ClusterNode;
    followers: ClusterNode[];
    unhealthy: ClusterNode[];
    currentTerm: number;
  } {
    const leader = Array.from(this.nodes.values()).find((n) => n.state === 'leader');
    const followers = Array.from(this.nodes.values()).filter((n) => n.state === 'follower');
    const unhealthy = Array.from(this.nodes.values()).filter(
      (n) => !n.isAlive || n.state === 'unavailable'
    );

    return {
      leader,
      followers,
      unhealthy,
      currentTerm: this.consensus.currentTerm,
    };
  }

  /**
   * Get operations statistics
   */
  getStatistics(): Record<string, unknown> {
    const activeTransactions = Array.from(this.transactions.values()).filter(
      (t) => t.status !== 'committed' && t.status !== 'aborted'
    );

    const activeLocks = Array.from(this.locks.values()).filter(
      (l) => !this.isLockExpired(l.id)
    );

    return {
      registeredNodes: this.nodes.size,
      aliveNodes: Array.from(this.nodes.values()).filter((n) => n.isAlive).length,
      currentTerm: this.consensus.currentTerm,
      logSize: this.consensus.log.length,
      commitIndex: this.consensus.commitIndex,
      activeLocks: activeLocks.length,
      activeTransactions: activeTransactions.length,
      completedTransactions: Array.from(this.transactions.values()).filter(
        (t) => t.status === 'committed'
      ).length,
      abortedTransactions: Array.from(this.transactions.values()).filter(
        (t) => t.status === 'aborted'
      ).length,
      replicatedResources: this.replicationLog.size,
    };
  }

  /**
   * Private: Check lock expiration
   */
  private isLockExpired(lockId: string): boolean {
    const lock = this.locks.get(lockId);
    if (!lock) {
return true;
}

    return Date.now() > lock.expiresAt;
  }

  /**
   * Private: Check lock conflict
   */
  private hasLockConflict(existing: LockMode, requested: LockMode): boolean {
    if (existing === 'exclusive' || requested === 'exclusive') {
      return true;
    }

    return false;
  }

  /**
   * Shutdown manager
   */
  shutdown(): void {
    this.nodes.clear();
    this.locks.clear();
    this.transactions.clear();
    this.replicationLog.clear();
  }
}

// Export singleton
export const distributedOperationsManager = new DistributedOperationsManager();
