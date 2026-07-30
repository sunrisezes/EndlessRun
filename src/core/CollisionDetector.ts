import { Character } from '../components/Character';
import { Obstacle, ObstaclePool } from '../components/ObstaclePool';

export class CollisionDetector {
  private static readonly HITBOX_PADDING_X = 0.15;
  private static readonly HITBOX_PADDING_Z = 0.15;

  /**
   * Checks for precise AABB collision between character and active obstacles.
   * Takes jump height and slide height state into account for forgiving clearance.
   */
  public static checkCollisions(
    character: Character,
    obstaclePool: ObstaclePool
  ): Obstacle | null {
    if (character.state === 'DEAD') return null;

    const activeObstacles = obstaclePool.getActiveObstacles();

    // 1. Get character AABB with forgiving padding tolerance
    const charBox = character.getBoundingBox();
    charBox.min.x += CollisionDetector.HITBOX_PADDING_X;
    charBox.max.x -= CollisionDetector.HITBOX_PADDING_X;
    charBox.min.z += CollisionDetector.HITBOX_PADDING_Z;
    charBox.max.z -= CollisionDetector.HITBOX_PADDING_Z;

    for (const obstacle of activeObstacles) {
      // Fast broadphase distance check (only evaluate obstacles near player Z)
      const distZ = Math.abs(obstacle.group.position.z - character.position.z);
      if (distZ > 10.0) continue;

      const obsBox = obstacle.boundingBox;

      // 2. Perform AABB Intersection Test
      if (charBox.intersectsBox(obsBox)) {
        // 3. Resolve State-Based Clearance Exceptions

        // LOW BARRIER clearance (Jump Over):
        // If obstacle is LOW_BARRIER and character feet position.y is higher than barrier beam (y >= 0.95), pass safely!
        if (obstacle.type === 'LOW_BARRIER' && character.position.y >= 0.95) {
          continue; // Cleared barrier!
        }

        // HIGH BEAM clearance (Slide Under):
        // If obstacle is HIGH_BEAM and character is in SLIDING state (height reduced to 0.9), pass safely!
        if (obstacle.type === 'HIGH_BEAM' && character.state === 'SLIDING') {
          continue; // Cleared beam!
        }

        // Collision confirmed!
        return obstacle;
      }
    }

    return null;
  }
}
