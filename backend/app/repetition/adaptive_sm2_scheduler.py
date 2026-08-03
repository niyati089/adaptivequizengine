from datetime import datetime, timedelta
import math


class AdaptiveSM2Scheduler:
    """
    Enhanced SM-2 with IRT integration and Ebbinghaus forgetting curve modeling.
    Optimizes review scheduling based on learner ability and question difficulty.
    """

    def calculate_next_review_adaptive(
        self,
        rating: int,
        ease_factor: float,
        interval_days: int,
        repetition_count: int,
        theta: float = 0.0,
        difficulty: float = 0.0,
        target_retention: float = 0.85,
    ) -> dict:
        """
        Calculate next review using SM-2 + IRT theta + Ebbinghaus forgetting curve.

        Steps:
        1. Base SM-2 interval calculation (standard algorithm)
        2. Ebbinghaus forgetting curve adjustment (target retention)
        3. IRT ability adjustment (high theta = longer intervals)
        4. Difficulty adjustment (harder questions = shorter initial intervals)
        5. Combine into final interval
        """

        # 1. BASE SM-2
        if rating >= 3:
            if repetition_count == 0:
                base_interval = 1
            elif repetition_count == 1:
                base_interval = 6
            else:
                base_interval = round(interval_days * ease_factor)
            new_repetition_count = repetition_count + 1
        else:
            new_repetition_count = 0
            base_interval = 1

        new_ease_factor = ease_factor + (
            0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)
        )
        new_ease_factor = max(1.3, new_ease_factor)

        # 2. EBBINGHAUS FORGETTING CURVE ADJUSTMENT
        # Adjusts interval so we hit the target retention probability at review time.
        forgetting_factor = self._calculate_forgetting_adjustment(
            interval_days=base_interval,
            target_retention=target_retention,
        )
        adjusted_interval = int(base_interval * forgetting_factor)

        # 3. IRT ABILITY ADJUSTMENT
        # High ability learners can afford longer gaps between reviews.
        # theta is clamped to [-3, +3]; multiplier range ≈ [0.5, 1.5]
        ability_multiplier = 1.0 + (theta / 3.0) * 0.5

        # 4. DIFFICULTY ADJUSTMENT
        # Harder questions need shorter revisit intervals initially.
        # difficulty is also on a similar scale; multiplier range ≈ [0.7, 1.0]
        difficulty_multiplier = 1.0 - (difficulty / 3.0) * 0.3

        # 5. FINAL INTERVAL — floor at 1 day
        final_interval = int(adjusted_interval * ability_multiplier * difficulty_multiplier)
        final_interval = max(1, final_interval)

        next_review_date = datetime.utcnow() + timedelta(days=final_interval)

        return {
            "ease_factor": round(new_ease_factor, 4),
            "interval_days": final_interval,
            "repetition_count": new_repetition_count,
            "next_review_date": next_review_date,
            "metrics": {
                "base_interval": base_interval,
                "forgetting_factor": round(forgetting_factor, 3),
                "ability_multiplier": round(ability_multiplier, 3),
                "difficulty_multiplier": round(difficulty_multiplier, 3),
                "retention_target": target_retention,
            },
        }

    @staticmethod
    def _calculate_forgetting_adjustment(
        interval_days: int,
        target_retention: float,
    ) -> float:
        """
        Uses Ebbinghaus curve R(t) = e^(-t/S).
        Returns a multiplier that bends the SM-2 interval toward
        the target retention probability.
        """
        if interval_days == 0:
            return 1.0
        # Normalise against the 50%-recall reference point
        curve_factor = math.log(max(1e-9, target_retention)) / math.log(0.5)
        return min(1.5, 1.0 + curve_factor * 0.2)

    def get_optimal_review_time(
        self,
        learner_theta: float,
        question_difficulty: float,
        last_review_date: datetime,
        mastery_level: float | None = None,
    ) -> datetime:
        """
        Estimate the optimal next review date for a learner-question pair,
        independent of the SM-2 state machine (useful for first-time scheduling).
        """
        target_interval = 7  # baseline days

        # Ability: high theta → longer gap
        ability_factor = 1.0 + (learner_theta / 3.0) * 0.4
        target_interval = int(target_interval * ability_factor)

        # Difficulty: harder → shorter gap
        difficulty_factor = 1.0 - (question_difficulty / 3.0) * 0.3
        target_interval = int(target_interval * difficulty_factor)

        # High mastery → extend interval by 30 %
        if mastery_level and mastery_level > 0.85:
            target_interval = int(target_interval * 1.3)

        optimal_date = last_review_date + timedelta(days=target_interval)
        return max(datetime.utcnow(), optimal_date)
