import { ConcurrentModificationException } from '../exceptions/concurrent-modification.exception';

interface VersionedUpdateManyDelegate {
  updateMany(args: {
    where: { id: number; updatedAt: Date };
    data: { updatedAt: Date };
  }): Promise<{ count: number }>;
}

/**
 * Guards a relation-replace (delete-all + recreate) update against lost
 * updates. Must run inside the same transaction as the replace itself: does a
 * conditional `updateMany` keyed on `id` + `updatedAt`, throwing when no row
 * matched (the record changed since `expectedUpdatedAt` was read).
 *
 * `updatedAt` is bumped explicitly here rather than left to Prisma's
 * `@updatedAt` default: with an otherwise-empty `data`, `@updatedAt` does not
 * fire, so the token would never advance and a second call with the same
 * stale `expectedUpdatedAt` would wrongly succeed.
 */
export async function assertNotStale(
  delegate: VersionedUpdateManyDelegate,
  id: number,
  expectedUpdatedAt: Date,
): Promise<void> {
  const { count } = await delegate.updateMany({
    where: { id, updatedAt: expectedUpdatedAt },
    data: { updatedAt: new Date() },
  });
  if (count === 0) {
    throw new ConcurrentModificationException();
  }
}
