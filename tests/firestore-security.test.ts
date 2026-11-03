import { describe, it, expect } from 'vitest';
import { 
  mapGoalDoc, 
  mapTransactionDoc, 
  mapEventDoc, 
  mapBucketItemDoc 
} from '../src/utils/firestoreUtils';
import fs from 'fs';
import path from 'path';

describe('Firestore Security & Document Integrity', () => {
  describe('Untrusted Stored Document IDs (Issue 4)', () => {
    it('prevents stored id fields from hijacking the canonical goal ID', () => {
      // Attacker attempts to store a forged ID inside Firestore document data
      const mockSnap: any = {
        id: 'canonical_goal_id_real',
        data: () => ({
          id: 'victim_goal_id_to_overwrite',
          ownerUid: 'attacker_123',
          collaborators: ['attacker_123'],
          name: 'Weekend Trip',
          targetAmount: 5000,
          currentAmount: 100,
          deadline: '2026-12-31',
          createdAt: '2026-01-01'
        })
      };

      const result = mapGoalDoc(mockSnap);
      expect(result.id).toBe('canonical_goal_id_real');
      expect(result.id).not.toBe('victim_goal_id_to_overwrite');
    });

    it('prevents stored id fields from hijacking canonical transaction ID', () => {
      const mockSnap: any = {
        id: 'canonical_tx_real_999',
        data: () => ({
          id: 'victim_tx_to_delete',
          ownerUid: 'attacker_123',
          goalId: 'goal_123',
          amount: 500,
          date: '2026-02-14',
          contributor: 'Me',
          type: 'deposit',
          createdAt: '2026-02-14'
        })
      };

      const result = mapTransactionDoc(mockSnap);
      expect(result.id).toBe('canonical_tx_real_999');
      expect(result.id).not.toBe('victim_tx_to_delete');
    });

    it('prevents stored id fields from hijacking canonical event ID', () => {
      const mockSnap: any = {
        id: 'canonical_event_real_456',
        data: () => ({
          id: 'victim_event_target',
          ownerUid: 'attacker_123',
          title: 'Dinner',
          date: '2026-03-01',
          collaborators: ['attacker_123'],
          createdAt: '2026-03-01'
        })
      };

      const result = mapEventDoc(mockSnap);
      expect(result.id).toBe('canonical_event_real_456');
      expect(result.id).not.toBe('victim_event_target');
    });

    it('prevents stored id fields from hijacking bucket list item ID', () => {
      const mockSnap: any = {
        id: 'canonical_bucket_item_789',
        data: () => ({
          id: 'victim_item_target',
          title: 'Stargazing',
          category: 'Outdoor',
          estimatedBudget: 300,
          createdAt: '2026-01-01'
        })
      };

      const result = mapBucketItemDoc(mockSnap);
      expect(result.id).toBe('canonical_bucket_item_789');
      expect(result.id).not.toBe('victim_item_target');
    });
  });

  describe('Firestore Security Rules Static Analysis (Issue 2)', () => {
    const rulesPath = path.resolve(__dirname, '../firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    it('enforces that only goal owner can modify collaborator list', () => {
      // In firestore.rules, goals update rule must differentiate owner vs collaborator
      // Collaborator must NOT have permission to touch 'collaborators' key
      expect(rulesContent).toContain("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentAmount'])");
      expect(rulesContent).toContain("request.auth.uid == resource.data.ownerUid");
    });

    it('prevents collaborators from deleting goals', () => {
      const goalDeleteSection = rulesContent.match(/match \/goals\/\{goalId\}[\s\S]*?allow delete:\s*if\s*([^;]+);/);
      expect(goalDeleteSection).not.toBeNull();
      if (goalDeleteSection) {
        expect(goalDeleteSection[1]).toContain('request.auth.uid == resource.data.ownerUid');
        expect(goalDeleteSection[1]).not.toContain('isGoalCollaborator');
      }
    });

    it('prevents collaborators from deleting events', () => {
      const eventDeleteSection = rulesContent.match(/match \/events\/\{eventId\}[\s\S]*?allow delete:\s*if\s*([^;]+);/);
      expect(eventDeleteSection).not.toBeNull();
      if (eventDeleteSection) {
        expect(eventDeleteSection[1]).toContain('request.auth.uid == resource.data.ownerUid');
        expect(eventDeleteSection[1]).not.toContain('isCollaborator');
      }
    });

    it('enforces canonical ID matching on document write', () => {
      expect(rulesContent).toContain('data.id == goalId');
      expect(rulesContent).toContain('data.id == transactionId');
      expect(rulesContent).toContain('data.id == eventId');
    });

    it('enforces ID format validation against path traversal', () => {
      expect(rulesContent).toContain('isValidId(id)');
      expect(rulesContent).toContain("id.matches('^[a-zA-Z0-9_\\\\-]+$')");
    });

    it('requires transaction creator to be an authorized collaborator of the target goal', () => {
      expect(rulesContent).toContain('isGoalCollaborator(request.resource.data.goalId)');
    });

    it('has explicit rules for the bucketList subcollection', () => {
      expect(rulesContent).toContain('match /bucketList/{itemId}');
    });
  });
});
