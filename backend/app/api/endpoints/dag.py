from fastapi import APIRouter, HTTPException, Query
import os
from app.dag.topic_dag import TopicDAGEngine

router = APIRouter()

@router.get("/generate")
async def generate_dag(topic: str = Query(..., description="The main topic to generate a DAG and subtopics for")):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY not configured")
    
    try:
        engine = TopicDAGEngine(api_key=api_key)
        data = engine.generate_dag_and_notes(topic)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate DAG: {str(e)}")
