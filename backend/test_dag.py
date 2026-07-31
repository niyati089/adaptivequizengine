
import os
import sys
import json
from dotenv import load_dotenv
load_dotenv()
from app.dag.topic_dag import TopicDAGEngine

try:
    engine = TopicDAGEngine(api_key=os.getenv('GROQ_API_KEY'))
    print(engine.generate_dag_and_notes('Math'))
except Exception as e:
    import traceback
    traceback.print_exc()

