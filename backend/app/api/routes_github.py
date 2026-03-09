import logging
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import httpx
from typing import Dict, Any, Optional

from app.db.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.core.config import settings
import base64

logger = logging.getLogger("app.api.routes_github")

router = APIRouter()

# Scopes needed:
# repo - to create repos, push code
# workflow - to push GitHub actions workflows
GITHUB_SCOPES = "repo workflow"

@router.get("/auth-url")
def get_auth_url() -> Dict[str, str]:
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured.")
    url = f"https://github.com/login/oauth/authorize?client_id={settings.GITHUB_CLIENT_ID}&scope={GITHUB_SCOPES}"
    return {"url": url}

@router.post("/connect")
async def connect_github(
    code: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured.")

    async with httpx.AsyncClient() as client:
        # 1. Exchange code for access token
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code
            },
            headers={"Accept": "application/json"}
        )
        if resp.status_code != 200:
            logger.error("Failed to exchange code: %s", resp.text)
            raise HTTPException(status_code=400, detail="Failed to connect to GitHub.")

        data = resp.json()
        access_token = data.get("access_token")

        if not access_token:
            logger.error("No access token in response: %s", data)
            raise HTTPException(status_code=400, detail="Invalid GitHub callback code.")

        # 2. Get GitHub username
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "EduAi"
            }
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get GitHub user details.")

        github_username = user_resp.json().get("login")

        # 3. Store in DB
        current_user.github_access_token = access_token
        current_user.github_username = github_username
        db.commit()

        return {"status": "success", "github_username": github_username}

@router.get("/status")
def get_github_status(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    connected = bool(current_user.github_access_token)
    return {
        "connected": connected,
        "github_username": current_user.github_username if connected else None
    }

@router.post("/disconnect")
def disconnect_github(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Dict[str, str]:
    current_user.github_access_token = None
    current_user.github_username = None
    db.commit()
    return {"status": "success"}

@router.post("/deploy-portfolio")
async def deploy_portfolio(
    html_content: str = Body(...),
    repo_name: str = Body(...),
    workflow_yaml: str = Body(...),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    token = current_user.github_access_token
    if not token:
        raise HTTPException(status_code=400, detail="GitHub not connected.")

    username = current_user.github_username
    if not username:
        raise HTTPException(status_code=400, detail="GitHub username not found.")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "EduAi"
    }

    async with httpx.AsyncClient() as client:
        # 1. Create Repository (ignore 422 if it already exists)
        logger.info(f"Creating repo {repo_name} for user {username}")
        repo_resp = await client.post(
            "https://api.github.com/user/repos",
            headers=headers,
            json={
                "name": repo_name,
                "description": "My Personal Portfolio (Auto-deployed via EduAi)",
                "private": False,
                "auto_init": True
            }
        )
        # 422 usually means it already exists, which is fine
        if repo_resp.status_code not in [201, 422]:
            logger.error("Failed to create repo: %s", repo_resp.text)
            raise HTTPException(status_code=500, detail="Failed to create GitHub repository.")

        # Helper to push a file
        async def push_file(path: str, content: str, message: str):
            # check if file exists to get SHA
            sha = None
            get_resp = await client.get(
                f"https://api.github.com/repos/{username}/{repo_name}/contents/{path}",
                headers=headers
            )
            if get_resp.status_code == 200:
                sha = get_resp.json().get("sha")

            payload = {
                "message": message,
                "content": base64.b64encode(content.encode()).decode()
            }
            if sha:
                payload["sha"] = sha

            put_resp = await client.put(
                f"https://api.github.com/repos/{username}/{repo_name}/contents/{path}",
                headers=headers,
                json=payload
            )
            if put_resp.status_code not in [200, 201]:
                logger.error("Failed to push %s: %s", path, put_resp.text)
                raise HTTPException(status_code=500, detail=f"Failed to push {path} to repository.")

        # 2. Push index.html
        await push_file("index.html", html_content, "Update portfolio HTML via EduAI")

        # 3. Push deploy.yml
        await push_file(".github/workflows/deploy.yml", workflow_yaml, "Update deploy workflow")

        # 4. Enable GitHub Pages configured for GitHub Actions
        # Actually, GitHub Pages with Actions doesn't strictly require API activation if the workflow runs,
        # but the first time it might help or we can just let the workflow handle it.
        # The workflow file already configures pages deploy. 

        deploy_url = f"https://{username}.github.io"
        if repo_name != f"{username}.github.io":
            deploy_url = f"https://{username}.github.io/{repo_name}"

        return {
            "status": "success",
            "url": deploy_url,
            "message": "Portfolio pushed successfully. GitHub Actions is now deploying it."
        }
