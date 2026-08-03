from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.socratic import SocraticRequest, SocraticResponse
from app.services.advanced_socratic_service import AdvancedSocraticService
from app.database.session import get_db
from app.api.endpoints.users import get_current_student
from pydantic import BaseModel

router = APIRouter()
service = AdvancedSocraticService()


@router.post("/hint-adaptive", response_model=SocraticResponse)
async def get_adaptive_hint(
    request: SocraticRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_student)
):
    """
    Get adaptive Socratic hint with multi-level difficulty.

    Automatically detects misconceptions and calibrates hint level based on:
    - Learner ability (theta)
    - Confidence level
    - Previous hints given

    Args:
        request: SocraticRequest with question, answers, confidence, theta
        db: Database session
        current_user: Current authenticated user

    Returns:
        SocraticResponse with hint, level, misconception, and metadata
    """
    try:
        # Set user_id from authenticated user if not provided
        if not request.user_id:
            request.user_id = current_user.id

        hint_response = await service.get_adaptive_hint(request, db)
        return hint_response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in get_adaptive_hint: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate hint")


@router.post("/hint-escalate", response_model=SocraticResponse)
async def escalate_hint(
    session_id: str,
    request: SocraticRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_student)
):
    """
    Escalate to next level of hint for the same question.
    Use when learner doesn't understand current hint.

    Args:
        session_id: ID of hint session from previous /hint-adaptive call
        request: Updated SocraticRequest
        db: Database session
        current_user: Current authenticated user

    Returns:
        SocraticResponse with escalated hint
    """
    try:
        if not request.user_id:
            request.user_id = current_user.id

        hint_response = await service.get_next_level_hint(session_id, request, db)
        return hint_response

    except Exception as e:
        print(f"Error in escalate_hint: {e}")
        raise HTTPException(status_code=500, detail="Failed to escalate hint")


class HintOutcomeRequest(BaseModel):
    hint_id: str
    did_help: bool
    time_to_understand: int = 0  # seconds
    hint_level: int = None


@router.post("/hint-outcome")
async def track_hint_outcome(
    request: HintOutcomeRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_student)
):
    """
    Track whether a hint was effective.
    Use this feedback to improve future personalization.

    Args:
        request: HintOutcomeRequest with hint_id, did_help, time_to_understand
        db: Database session
        current_user: Current authenticated user

    Returns:
        Tracking record with efficiency score
    """
    try:
        result = await service.track_hint_outcome(
            hint_id=request.hint_id,
            learner_id=current_user.id,
            did_help=request.did_help,
            time_to_understand=request.time_to_understand,
            hint_level=request.hint_level
        )
        return result

    except Exception as e:
        print(f"Error tracking hint outcome: {e}")
        raise HTTPException(status_code=500, detail="Failed to track outcome")


@router.get("/session/{session_id}")
async def get_session_summary(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_student)
):
    """
    Get summary of a Socratic hint session.

    Args:
        session_id: ID of session
        db: Database session
        current_user: Current authenticated user

    Returns:
        Session summary with hints given, misconception detected, etc
    """
    try:
        summary = service.get_session_summary(session_id)
        return summary

    except Exception as e:
        print(f"Error getting session summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to get session summary")


@router.delete("/session/{session_id}")
async def clear_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_student)
):
    """
    Clear hint session data (e.g., when moving to new question).

    Args:
        session_id: ID of session to clear
        db: Database session
        current_user: Current authenticated user

    Returns:
        Success status
    """
    try:
        success = service.clear_session(session_id)
        if success:
            return {"success": True, "message": f"Session {session_id} cleared"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")

    except Exception as e:
        print(f"Error clearing session: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear session")


@router.get("/metrics")
async def get_service_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_student)
):
    """
    Get metrics from the Socratic service.

    Returns:
        Service metrics including dialogue history, hint patterns, etc
    """
    try:
        metrics = service.get_agent_metrics()
        return metrics

    except Exception as e:
        print(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get metrics")
