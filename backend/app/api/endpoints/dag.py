from fastapi import APIRouter, HTTPException, Query
import os
import logging
from app.dag.topic_dag import TopicDAGEngine

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/generate")
async def generate_dag(topic: str = Query(..., description="The main topic to generate a DAG and subtopics for")):
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY not configured")
    
    try:
        engine = TopicDAGEngine(api_key=api_key)
        data = engine.generate_dag_and_notes(topic)
        return data
    except RuntimeError as e:
        logger.error(f"DAG generation failed for topic '{topic}': {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in DAG endpoint for topic '{topic}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate DAG: {str(e)}")
