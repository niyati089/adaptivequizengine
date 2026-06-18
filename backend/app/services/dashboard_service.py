from app.analytics.revision_analytics import RevisionAnalytics
from app.schemas.dashboard import RevisionMetricsResponse

class DashboardService:
    def __init__(self):
        self.revision_analytics = RevisionAnalytics()
        
    def get_revision_metrics(self, user_id: int) -> RevisionMetricsResponse:
        """
        Fetches and maps revision analytics metrics for the dashboard.
        """
        metrics = self.revision_analytics.calculate_revision_metrics(user_id)
        
        return RevisionMetricsResponse(
            due_today=metrics["due_today"],
            overdue=metrics["overdue"],
            upcoming_reviews=metrics["upcoming_reviews"],
            retention_score=metrics["retention_score"],
            mastered_topics=metrics["mastered_topics"]
        )
