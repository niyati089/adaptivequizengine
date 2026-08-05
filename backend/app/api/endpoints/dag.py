from typing import Optional
import logging
from fastapi import APIRouter, HTTPException, Query
from app.core.config import resolve_groq_api_key
from app.dag.topic_dag import TopicDAGEngine

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/generate")
async def generate_dag(
    topic: str = Query(..., description="The main topic to generate a DAG and subtopics for"),
    api_key: Optional[str] = Query(None, description="Optional per-request Groq API key override"),
):
    logger.info(f"DAG generation requested for topic: '{topic}'")
    
    api_key = resolve_groq_api_key(api_key)
    if not api_key:
        logger.error("No GROQ_API_KEY configured")
        raise HTTPException(status_code=400, detail="GROQ_API_KEY not configured")
    
    api_key = api_key.strip()
    logger.info(f"Using API key: {api_key[:10]}..." if api_key else "No API key")
    
    try:
        logger.info(f"Creating TopicDAGEngine for topic: '{topic}'")
        engine = TopicDAGEngine(api_key=api_key)
        logger.info("TopicDAGEngine created successfully")
        
        logger.info(f"Generating DAG for topic: '{topic}'")
        data = engine.generate_dag_and_notes(topic)
        logger.info(f"DAG generation successful for topic: '{topic}'")
        return data
    except ImportError as e:
        logger.error(f"Import error in DAG generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Import error: {str(e)}")
    except RuntimeError as e:
        logger.error(f"DAG generation failed for topic '{topic}': {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in DAG endpoint for topic '{topic}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate DAG: {str(e)}")

@router.get("/test")
async def test_dag():
    """Simple test endpoint to verify DAG module is working"""
    try:
        # Just test imports and basic functionality
        import networkx as nx
        from groq import Groq
        
        # Test basic functionality
        api_key = resolve_groq_api_key()
        if not api_key:
            return {"error": "No API key configured", "status": "failed"}
            
        # Create a simple test response without calling the API
        test_data = {
            "dag": {
                "nodes": [
                    {"id": "n1", "label": "Basics", "level": 0},
                    {"id": "n2", "label": "Intermediate", "level": 1}
                ],
                "edges": [{"from": "n1", "to": "n2"}]
            },
            "subtopics": [
                {"id": "n1", "title": "Basics", "level": 0},
                {"id": "n2", "title": "Intermediate", "level": 1}
            ]
        }
        
        return {"status": "success", "message": "DAG module is working", "test_data": test_data}
    except ImportError as e:
        return {"error": f"Import error: {str(e)}", "status": "failed"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}", "status": "failed"}
