import math

class ThetaEstimator:
    """
    Updates learner ability score using Rasch IRT (1-Parameter Logistic Model).
    """

    @staticmethod
    def irt_probability(theta: float, difficulty: float) -> float:
        """P(correct) = 1 / (1 + e^(-(theta - difficulty)))"""
        return 1 / (1 + math.exp(-(theta - difficulty)))

    @staticmethod
    def update_theta(theta: float, correct: bool, difficulty: float) -> float:
        """Simple EAP-style theta update after each response."""
        p = ThetaEstimator.irt_probability(theta, difficulty)
        learning_rate = 0.3
        if correct:
            theta += learning_rate * (1 - p)
        else:
            theta -= learning_rate * p
        return round(max(-3.0, min(3.0, theta)), 4)  # clamp to [-3, 3]

    @staticmethod
    def select_next_difficulty(theta: float) -> float:
        """Select question difficulty closest to current theta (max info point)."""
        return round(theta, 1)

    @staticmethod
    def theta_to_label(theta: float) -> str:
        if theta < -1.5: return "Beginner"
        if theta < -0.5: return "Elementary"
        if theta <  0.5: return "Intermediate"
        if theta <  1.5: return "Advanced"
        return "Expert"
