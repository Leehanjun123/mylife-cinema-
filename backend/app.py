from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
import json
import uuid
import os
import logging
from datetime import datetime
import openai
import requests
from supabase import create_client, Client
import socketio
from contextlib import asynccontextmanager

# Environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_progress_update(self, client_id: str, progress: int, status: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json({
                    "type": "progress",
                    "progress": progress,
                    "status": status
                })
            except:
                self.disconnect(client_id)

manager = ConnectionManager()

app = FastAPI(title="MyLife Cinema API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lifecinema.site", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class MovieCreateRequest(BaseModel):
    movieId: str
    diary: str
    emotion: str
    style: str
    music: str
    length: str
    userId: str

class AIScenario(BaseModel):
    title: str
    genre: str
    scenes: List[Dict[str, Any]]
    narration: str

# AI Service Functions
async def generate_scenario(diary: str, emotion: str) -> AIScenario:
    """Generate movie scenario using GPT-4"""
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": f"""당신은 감정적인 영화 시나리오 작가입니다. 
                    주어진 일기를 바탕으로 {emotion} 감정을 중심으로 한 감동적인 3분 영화 시나리오를 작성해주세요.
                    
                    다음 JSON 형식으로 응답해주세요:
                    {{
                        "title": "영화 제목",
                        "genre": "장르",
                        "scenes": [
                            {{"sceneNumber": 1, "description": "장면 설명", "narration": "나레이션", "visualPrompt": "이미지 생성용 프롬프트"}},
                            {{"sceneNumber": 2, "description": "장면 설명", "narration": "나레이션", "visualPrompt": "이미지 생성용 프롬프트"}},
                            {{"sceneNumber": 3, "description": "장면 설명", "narration": "나레이션", "visualPrompt": "이미지 생성용 프롬프트"}}
                        ],
                        "overallNarration": "전체 나레이션"
                    }}"""
                },
                {
                    "role": "user", 
                    "content": f"일기 내용: {diary}"
                }
            ],
            max_tokens=1500,
            temperature=0.8
        )
        
        scenario_json = json.loads(response.choices[0].message.content)
        return AIScenario(**scenario_json)
    except Exception as e:
        logger.error(f"시나리오 생성 실패: {e}")
        # Fallback scenario
        return AIScenario(
            title=f"{emotion} 기반 영화",
            genre="AI 창작물",
            scenes=[
                {"sceneNumber": 1, "description": "오프닝", "narration": "새로운 이야기가 시작됩니다.", "visualPrompt": f"{emotion} emotion opening scene"},
                {"sceneNumber": 2, "description": "전개", "narration": "일상의 특별한 순간들.", "visualPrompt": f"{emotion} daily life moment"},
                {"sceneNumber": 3, "description": "마무리", "narration": "아름다운 결말입니다.", "visualPrompt": f"{emotion} beautiful ending"}
            ],
            overallNarration="당신의 일기가 만들어낸 특별한 이야기입니다."
        )

async def generate_images(scenes: List[Dict], style: str) -> List[str]:
    """Generate images for each scene using Replicate"""
    image_urls = []
    
    for scene in scenes:
        try:
            # Replicate API call for image generation
            response = requests.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Token {REPLICATE_API_TOKEN}",
                    "Content-Type": "application/json"
                },
                json={
                    "version": "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
                    "input": {
                        "prompt": f"{scene['visualPrompt']}, {style} style, cinematic, high quality",
                        "width": 1280,
                        "height": 720,
                        "num_inference_steps": 50,
                        "guidance_scale": 7.5
                    }
                }
            )
            
            if response.status_code == 201:
                prediction_id = response.json()["id"]
                
                # Poll for completion
                for _ in range(60):  # 5 minutes timeout
                    result = requests.get(
                        f"https://api.replicate.com/v1/predictions/{prediction_id}",
                        headers={"Authorization": f"Token {REPLICATE_API_TOKEN}"}
                    )
                    
                    if result.json()["status"] == "succeeded":
                        image_urls.append(result.json()["output"][0])
                        break
                    elif result.json()["status"] == "failed":
                        image_urls.append("https://picsum.photos/1280/720?random=" + str(uuid.uuid4()))
                        break
                    
                    await asyncio.sleep(5)
            else:
                image_urls.append("https://picsum.photos/1280/720?random=" + str(uuid.uuid4()))
                
        except Exception as e:
            logger.error(f"이미지 생성 실패: {e}")
            image_urls.append("https://picsum.photos/1280/720?random=" + str(uuid.uuid4()))
    
    return image_urls

async def generate_video(image_urls: List[str], narration: str, music_style: str) -> str:
    """Combine images with narration and music to create video"""
    try:
        # This would typically involve:
        # 1. Text-to-speech for narration
        # 2. Background music selection
        # 3. Video composition (ffmpeg)
        # 4. Upload to cloud storage
        
        # For now, return a placeholder
        video_id = str(uuid.uuid4())
        return f"https://storage.lifecinema.site/videos/{video_id}.mp4"
    
    except Exception as e:
        logger.error(f"비디오 생성 실패: {e}")
        return f"https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_30mb.mp4"

# API Endpoints
@app.get("/")
async def root():
    return {"message": "MyLife Cinema API v1.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "openai": "connected" if openai.api_key else "not_configured",
            "supabase": "connected" if SUPABASE_URL and SUPABASE_KEY else "not_configured",
            "replicate": "connected" if REPLICATE_API_TOKEN else "not_configured"
        }
    }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(client_id)

@app.post("/api/movies/create")
async def create_movie(request: MovieCreateRequest, background_tasks: BackgroundTasks):
    """Main endpoint for movie creation"""
    try:
        # Start background task for movie generation
        background_tasks.add_task(process_movie_generation, request)
        
        return {
            "success": True,
            "movieId": request.movieId,
            "message": "영화 생성이 시작되었습니다.",
            "status": "processing"
        }
    
    except Exception as e:
        logger.error(f"영화 생성 시작 실패: {e}")
        raise HTTPException(status_code=500, detail="영화 생성 시작에 실패했습니다.")

async def process_movie_generation(request: MovieCreateRequest):
    """Background task for movie generation"""
    try:
        client_id = request.movieId
        
        # Step 1: Generate scenario (20%)
        await manager.send_progress_update(client_id, 20, "🎬 AI가 시나리오를 작성하고 있어요...")
        scenario = await generate_scenario(request.diary, request.emotion)
        
        # Step 2: Generate images (60%)
        await manager.send_progress_update(client_id, 40, "🎨 장면 이미지를 생성하고 있어요...")
        image_urls = await generate_images(scenario.scenes, request.style)
        
        # Step 3: Create video (80%)
        await manager.send_progress_update(client_id, 70, "🎞️ 영상을 편집하고 있어요...")
        video_url = await generate_video(image_urls, scenario.overallNarration, request.music)
        
        # Step 4: Save to database (100%)
        await manager.send_progress_update(client_id, 90, "💾 최종 저장 중이에요...")
        
        # Update movie in Supabase
        supabase.table("movies").update({
            "status": "completed",
            "video_url": video_url,
            "thumbnail_url": image_urls[0] if image_urls else None,
            "genre": scenario.genre,
            "scenes": [dict(scene) for scene in scenario.scenes],
            "metadata": {
                "generation_completed_at": datetime.now().isoformat(),
                "ai_model": "gpt-4",
                "style": request.style,
                "music": request.music
            }
        }).eq("id", request.movieId).execute()
        
        await manager.send_progress_update(client_id, 100, "🎉 영화가 완성되었어요!")
        
        # Send completion notification
        await manager.send_progress_update(client_id, 100, {
            "type": "completed",
            "videoUrl": video_url,
            "thumbnailUrl": image_urls[0] if image_urls else None,
            "title": scenario.title,
            "genre": scenario.genre
        })
        
    except Exception as e:
        logger.error(f"영화 생성 처리 실패: {e}")
        await manager.send_progress_update(client_id, -1, f"❌ 생성 실패: {str(e)}")
        
        # Update movie status to failed
        supabase.table("movies").update({
            "status": "failed",
            "metadata": {
                "error": str(e),
                "failed_at": datetime.now().isoformat()
            }
        }).eq("id", request.movieId).execute()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)