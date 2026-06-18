from datetime import datetime, timedelta

class SM2Scheduler:
    """
    Simplified SM-2 implementation for spaced repetition.
    """

    @staticmethod
    def calculate_next_review(rating: int, ease_factor: float, interval_days: int, repetition_count: int) -> dict:
        """
        Calculates the next review parameters based on the SM-2 algorithm.
        Rating scale: 0 to 5.
        - 0: Complete blackout
        - 1: Incorrect, but remembered the correct answer after seeing it
        - 2: Incorrect, but it seemed easy to remember
        - 3: Correct response recalled with serious difficulty
        - 4: Correct response after a hesitation
        - 5: Perfect response
        """
        # TODO: Implement advanced scheduling techniques (e.g., fractional intervals, fuzzy logic tweaks)
        
        if rating >= 3:
            if repetition_count == 0:
                new_interval = 1
            elif repetition_count == 1:
                new_interval = 6
            else:
                new_interval = round(interval_days * ease_factor)
            new_repetition_count = repetition_count + 1
        else:
            new_repetition_count = 0
            new_interval = 1

        new_ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
        if new_ease_factor < 1.3:
            new_ease_factor = 1.3

        next_review_date = datetime.utcnow() + timedelta(days=new_interval)

        return {
            "ease_factor": new_ease_factor,
            "interval_days": new_interval,
            "repetition_count": new_repetition_count,
            "next_review_date": next_review_date
        }
