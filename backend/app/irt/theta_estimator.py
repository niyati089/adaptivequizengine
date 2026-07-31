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
    def update_theta(theta: float, correct: bool, difficulty: float, question_index: int = 1) -> float:
        """EAP-style theta update with decreasing standard error over time."""
        # Ensure question_index is at least 1 to avoid division by zero
        q_num = max(1, question_index)
        
        # Base learning rate that decays as confidence increases
        learning_rate = 0.4 / math.sqrt(q_num)
        
        p = ThetaEstimator.irt_probability(theta, difficulty)
        if correct:
            theta += learning_rate * (1 - p)
        else:
            theta -= learning_rate * p
        return round(max(-3.0, min(3.0, theta)), 4)   

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
